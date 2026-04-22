import type {
  CreatePostRecordInput,
  ListPublicPostsInput,
  ListPublicPostsResult,
  ListUserPostsInput,
  ListUserPostsResult,
  PostRepositoryPort,
} from '../../src/modules/posts/application/ports/post-repository.port';
import type { PostSort } from '../../src/modules/posts/application/post-sort';
import { Post } from '../../src/modules/posts/domain/post';

export class InMemoryPostRepository implements PostRepositoryPort {
  private readonly posts = new Map<string, Post>();

  create(input: CreatePostRecordInput): Promise<Post> {
    const createdAt = new Date();
    const post = Post.create({
      id: `post-${this.posts.size + 1}`,
      userId: input.userId,
      tripId: input.tripId,
      title: input.title,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      visibility: input.visibility,
      createdAt,
      updatedAt: createdAt,
    });

    this.posts.set(post.id, post);

    return Promise.resolve(post);
  }

  findById(postId: string): Promise<Post | null> {
    return Promise.resolve(this.posts.get(postId) ?? null);
  }

  listPublic(input: ListPublicPostsInput): Promise<ListPublicPostsResult> {
    const filteredPosts = Array.from(this.posts.values())
      .filter((post) => post.visibility === 'public')
      .sort(createPostComparator(input.sort));
    const offset = input.page * input.size;

    return Promise.resolve({
      posts: filteredPosts.slice(offset, offset + input.size),
      totalElements: filteredPosts.length,
    });
  }

  listByUser(input: ListUserPostsInput): Promise<ListUserPostsResult> {
    const filteredPosts = Array.from(this.posts.values())
      .filter((post) => post.userId === input.userId)
      .sort(createPostComparator(input.sort));
    const offset = input.page * input.size;

    return Promise.resolve({
      posts: filteredPosts.slice(offset, offset + input.size),
      totalElements: filteredPosts.length,
    });
  }

  clear(): void {
    this.posts.clear();
  }
}

function createPostComparator(sort: PostSort) {
  return (left: Post, right: Post): number => {
    const primaryComparison = compareValues(
      resolvePostSortValue(left, sort),
      resolvePostSortValue(right, sort),
    );

    if (primaryComparison !== 0) {
      return sort.direction === 'asc'
        ? primaryComparison
        : primaryComparison * -1;
    }

    return compareValues(left.id, right.id);
  };
}

function resolvePostSortValue(post: Post, sort: PostSort): number {
  switch (sort.field) {
    case 'createdAt':
      return post.createdAt.getTime();
  }
}

function compareValues(left: number | string, right: number | string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
