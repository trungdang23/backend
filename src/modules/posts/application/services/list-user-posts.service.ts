import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import type { PostReadModel } from '../post-read-model';
import {
  POST_REPOSITORY,
  type ListUserPostsInput,
  type PostRepositoryPort,
} from '../ports/post-repository.port';
import { PostReadModelHydratorService } from './post-read-model-hydrator.service';

export interface ListUserPostsResult {
  posts: PostReadModel[];
  totalElements: number;
}

@Injectable()
export class ListUserPostsService
  implements UseCase<ListUserPostsInput, ListUserPostsResult>
{
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryPort,
    private readonly postReadModelHydrator: PostReadModelHydratorService,
  ) {}

  async execute(input: ListUserPostsInput): Promise<ListUserPostsResult> {
    const result = await this.postRepository.listByUser(input);

    return {
      posts: await this.postReadModelHydrator.hydrateMany(result.posts),
      totalElements: result.totalElements,
    };
  }
}
