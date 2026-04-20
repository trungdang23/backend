import { BadRequestException } from '@nestjs/common';

import {
  DEFAULT_POST_SORT,
  POST_SORT_FIELDS,
  type PostSort,
  type PostSortDirection,
  type PostSortField,
} from '../application/post-sort';

export function parsePostSort(sortValue?: string): PostSort {
  if (sortValue === undefined || sortValue.trim().length === 0) {
    return DEFAULT_POST_SORT;
  }

  const [field, direction, ...rest] = sortValue.trim().split(',');

  if (rest.length > 0) {
    throw new BadRequestException(
      'Sort must follow the format "<field>,<direction>".',
    );
  }

  if (!POST_SORT_FIELDS.includes(field as PostSortField)) {
    throw new BadRequestException('Post sort field is not supported.');
  }

  if (direction !== 'asc' && direction !== 'desc') {
    throw new BadRequestException('Post sort direction must be asc or desc.');
  }

  return {
    field: field as PostSortField,
    direction: direction as PostSortDirection,
  };
}

export function formatPostSort(sort: PostSort): string {
  return `${sort.field},${sort.direction}`;
}
