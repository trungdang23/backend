import type { Post } from '../../domain/post';
import type { PostSort } from '../post-sort';

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');

export interface CreatePostRecordInput {
  userId: string;
  tripId?: string | null;
  title: string;
  content: string;
  coverImageUrl?: string | null;
  visibility: string;
}

export interface ListPublicPostsInput {
  page: number;
  size: number;
  sort: PostSort;
}

export interface ListPublicPostsResult {
  posts: Post[];
  totalElements: number;
}

export interface ListUserPostsInput {
  userId: string;
  page: number;
  size: number;
  sort: PostSort;
}

export interface ListUserPostsResult {
  posts: Post[];
  totalElements: number;
}

export interface PostRepositoryPort {
  create(input: CreatePostRecordInput): Promise<Post>;
  findById(postId: string): Promise<Post | null>;
  listPublic(input: ListPublicPostsInput): Promise<ListPublicPostsResult>;
  listByUser(input: ListUserPostsInput): Promise<ListUserPostsResult>;
}
