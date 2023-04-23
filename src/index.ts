import 'reflect-metadata'

const WAY_METADATA_KEY = Symbol('Ways');

const SIDEWAY_METADATA_KEY = Symbol('SideWays');

export type Way = string | symbol

type Sideway = {
  effect: (this: unknown, ...args: unknown[]) => unknown
  name: string | symbol
}

class WaySet extends Map<string | symbol, Set<Way>> {
  constructor() {
    super()
  }

  addWay(property: string | symbol, way: Way) {
    if (this.has(property)) {
      this.get(property).add(way)
    } else {
      this.set(property, new Set([way]))
    }
  }
}

class SideWayMap extends Map<Way, Sideway[]> {
  constructor() {
    super()
  }

  addSideWay(sideWay: Sideway, ways: Way[]) {
    for (const way of ways) {
      if (this.has(way)) {
        this.get(way).push(sideWay)
      } else {
        this.set(way, [sideWay])
      }
    }
  }
}


function upsertWay(target: any, property: string, field: PropertyDescriptor, way: Way): void {
  console.log(`Upserting Way ${String(way)} for property '${property}'`)

  if (Reflect.hasMetadata(WAY_METADATA_KEY, target)) {
    const ways: WaySet = Reflect.getMetadata(WAY_METADATA_KEY, target)

    ways.addWay(property, way)

    return
  }

  const ways = new WaySet()

  ways.addWay(property, way)

  Reflect.defineMetadata(WAY_METADATA_KEY, ways, target)
}

function registerSideWay(target: any, property: string, method: PropertyDescriptor, ways: Way[]): void {
  console.log(`Registering SideWay ${String(property)} for ways ${ways.join()}`)

  if (Reflect.hasMetadata(SIDEWAY_METADATA_KEY, target)) {
    const sideWays: SideWayMap = Reflect.getMetadata(SIDEWAY_METADATA_KEY, target)

    sideWays.addSideWay({
      effect: method.value,
      name: property,
    }, ways)

    return
  }

  const sideWays = new SideWayMap()

  sideWays.addSideWay({
    effect: method.value,
    name: property,
  }, ways)

  Reflect.defineMetadata(SIDEWAY_METADATA_KEY, sideWays, target)
}

function getSideWays(target: any, way: Way): Sideway[] {
  if (Reflect.hasMetadata(SIDEWAY_METADATA_KEY, target)) {
    const sideWays: SideWayMap = Reflect.getMetadata(SIDEWAY_METADATA_KEY, target)

    const effects = sideWays.get(way)

    if (!effects) throw new Error(`No side ways registered for way ${String(way)}`)

    return effects
  }

  return []
}

export function GoesWays(...ways: Way[]): any {
  return (target: any, property: string, field: PropertyDescriptor) => ways.forEach(way => upsertWay(target, property, field, way))
}

export function SideWay(...ways: Way[]): any {
  return (target: any, property: string, method: PropertyDescriptor) => registerSideWay(target, property, method, ways)
}

export function GoSideWays(): any {
  return (target: any, property: string, method: PropertyDescriptor) => {
    const user = method.value

    method.value = async function(...args: unknown[]) {
      const wayArg = args[0]

      const result = await user.apply(this, args)

      if (typeof wayArg == `object`) {
        if (Reflect.hasMetadata(WAY_METADATA_KEY, wayArg)) {
          const waySet: WaySet = Reflect.getMetadata(WAY_METADATA_KEY, wayArg)

          waySet.forEach((ways, property) => {
            if (wayArg[property] === undefined) return

            console.log(`Found property ${String(property)} with ways`, ways)

            ways.forEach(way => {
              const sideWays = getSideWays(target, way)

              for (const sideway of sideWays) {
                console.log(`Applying ${String(sideway.name)} for ${String(way)}`)
                sideway.effect.apply(this, [wayArg])
              }
            })
          })
        }
      }
      return result
    }

    return method
  }
}
