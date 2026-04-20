import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import type { PostReadModel } from '../post-read-model';
import {
  POST_REPOSITORY,
  type ListPublicPostsInput,
  type PostRepositoryPort,
} from '../ports/post-repository.port';
import { PostReadModelHydratorService } from './post-read-model-hydrator.service';

export interface ListPublicPostsResult {
  posts: PostReadModel[];
  totalElements: number;
}

@Injectable()
export class ListPublicPostsService
  implements UseCase<ListPublicPostsInput, ListPublicPostsResult>
{
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryPort,
    private readonly postReadModelHydrator: PostReadModelHydratorService,
  ) {}

  async execute(input: ListPublicPostsInput): Promise<ListPublicPostsResult> {
    const result = await this.postRepository.listPublic(input);

    return {
      posts: await this.postReadModelHydrator.hydrateMany(result.posts),
      totalElements: result.totalElements,
    };
  }
}
