import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import type { PostReadModel } from '../post-read-model';
import {
  POST_REPOSITORY,
  type PostRepositoryPort,
} from '../ports/post-repository.port';
import { PostReadModelHydratorService } from './post-read-model-hydrator.service';

@Injectable()
export class GetPostDetailService implements UseCase<string, PostReadModel> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryPort,
    private readonly postReadModelHydrator: PostReadModelHydratorService,
  ) {}

  async execute(postId: string): Promise<PostReadModel> {
    const post = await this.postRepository.findById(postId);

    if (post === null || post.visibility !== 'public') {
      throw new NotFoundException('Post not found.');
    }

    return await this.postReadModelHydrator.hydrate(post);
  }
}
