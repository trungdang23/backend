import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import {
  POST_REPOSITORY,
  type PostRepositoryPort,
} from '../ports/post-repository.port';
import type { PostReadModel } from '../post-read-model';
import { PostReadModelHydratorService } from './post-read-model-hydrator.service';

export interface DeletePostInput {
  postId: string;
}

@Injectable()
export class DeletePostService
  implements UseCase<DeletePostInput, PostReadModel>
{
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryPort,
    private readonly postReadModelHydrator: PostReadModelHydratorService,
  ) {}

  async execute(input: DeletePostInput): Promise<PostReadModel> {
    const deletedPost = await this.postRepository.deleteById(input.postId);

    if (deletedPost === null) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Post not found.',
      });
    }

    return this.postReadModelHydrator.hydrate(deletedPost);
  }
}
