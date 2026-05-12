import { Inject, Injectable } from '@nestjs/common';

import type { UseCase } from '../../../../app/use-case';
import { POST_REPOSITORY, type PostRepositoryPort } from '../ports/post-repository.port';
import { Post } from '../../domain/post';
import { NotFoundException } from '@nestjs/common';

export interface DeletePostInput {
  postId: string;
}

@Injectable()
export class DeletePostService implements UseCase<DeletePostInput, Post> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryPort,
  ) {}

  async execute(input: DeletePostInput): Promise<Post> {
    const deletedPost = await this.postRepository.deleteById(input.postId);

    if (deletedPost === null) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: 'Post not found.',
      });
    }

    return deletedPost;
  }
}
