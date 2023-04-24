import { GoesWays, SideWay, GoSideWays } from '../src'

export const NOTIFY_FOLLOWERS = `NOTIFY_FOLLOWERS`
export const NOTIFY_AUTHOR = `NOTIFY_AUTHOR`
export const COMPUTE_INTERACTION = `COMPUTE_INTERACTION`

export class Post {
  constructor(input: Partial<Post> = {}) {
    Object.assign(this, input)
  }

  id: string

  @GoesWays(NOTIFY_FOLLOWERS)
  content: string

  @GoesWays(COMPUTE_INTERACTION)
  @GoesWays(NOTIFY_AUTHOR)
  comments: string[]

  author: string

  followers: string[]
}

type UpdatePost = Partial<Post> & { id: string }

export class PostService {
  public posts: Map<string, Post> = new Map()

  public createPost(input: Post) {
    this.posts.set(input.id, input)
  }

  @GoSideWays()
  public updatePost(input: UpdatePost) {
    const before = this.posts.get(input.id) ?? new Post()

    this.posts.set(input.id, { ...before, ...input })
  }

  @SideWay(NOTIFY_FOLLOWERS)
  public notifyFollowers(parent: { id: string }) {
    const post = this.posts.get(parent.id)

    if (!post) throw new Error(`Cannot notify followers of post ${parent.id} because it does not exist`)

    for (const follower of post.followers) {
      console.log(`Notifying ${follower} about post ${post.id}`)
    }
  }

  @SideWay(NOTIFY_AUTHOR)
  public notifyAuthor(parent: { id: string }) {
    const post = this.posts.get(parent.id)

    if (!post) throw new Error(`Cannot notify author of post ${parent.id} because it does not exist`)

    console.log(`Notifying ${post.author} about post ${post.id}`)
  }

  @SideWay(COMPUTE_INTERACTION)
  public computeInteraction(parent: { id: string }) {
    const post = this.posts.get(parent.id)

    if (!post) throw new Error(`Cannot compute interaction of post ${parent.id} because it does not exist`)

    console.log(`Computing interaction of post ${post.id}`)
  }

}

const post = new Post({ id: `1`, content: `Hello world`, author: `Teddy Randby`, followers: [`user1`, `user2`], comments: [] })

const postService = new PostService()

postService.createPost(post)

postService.updatePost(new Post({ id: `1`, content: `Hello world! This is updated!` }))

postService.updatePost(new Post({ id: `1`, comments: [`This is a comment`, `This is another comment`] }))
