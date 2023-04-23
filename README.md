# SIDEWAYS
A library for managing side effects and untagling complex code paths

First declare a 'SideWay' - aka a codepath/side-effect that should be executued only when certain inputs are present.
```ts
export const CHANGES_ADDRESS = `user_address_changed`
```

Declare what inputs should trigger the SideWay
```ts
export class UpdateUserInput {
    public id: string

    public username: string

    @GoesWays(CHANGES_ADDRESS)
    public address: string
}
```

In your services, declare a handler for each SideWay that the service handles
```ts
export class UserService {
    ...

    @SideWay(CHANGES_ADDRESS)
    public queueEmailJob(parent: { id: string }) {
        const job = new AccountUpdatedJob(
            parent.id,
            `Your address has been updated`,
        )

        this.emailQueue.add(job)
    }
}
```

Now, simply tell the method to take the input and go Sideways!
```ts
export class UserService {
    ...

    @GoSideWays()
    public updateUser(input: UpdateUserInput) {
        this.db.users.update(...)
    }
}
```

It is trivial to compose Ways!
```ts
export class UpdateDesignInput {
    ...

    @GoesWays(CHANGES_COST, CHANGES_PRODUCTION, CHANGES_SAVINGS)
    public panels: string
}
```

Potential features include:
- Some Ways *imply* going other Ways as well! (eg. CHANGES_PRODUCTION implies CHANGES_SAVINGS)
- Have some notion of what the previous value was so we only go sideways if the values differ
