export const POST_SORT_FIELDS = ['createdAt'] as const;

export type PostSortField = (typeof POST_SORT_FIELDS)[number];
export type PostSortDirection = 'asc' | 'desc';

export interface PostSort {
  field: PostSortField;
  direction: PostSortDirection;
}

export const DEFAULT_POST_SORT: PostSort = {
  field: 'createdAt',
  direction: 'desc',
};
