import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { tripNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import type { PostReadModel } from '../post-read-model';
import {
  POST_REPOSITORY,
  type PostRepositoryPort,
} from '../ports/post-repository.port';
import {
  TRIP_REPOSITORY,
  type TripRepositoryPort,
} from '../../../trips/application/ports/trip-repository.port';
import { Post } from '../../domain/post';
import { rethrowPostDomainError } from './map-post-domain-error';
import { PostReadModelHydratorService } from './post-read-model-hydrator.service';

export interface CreatePostInput {
  userId: string;
  title: string;
  content: string;
  coverImageUrl?: string | null;
  tripId?: string | null;
}

@Injectable()
export class CreatePostService implements UseCase<
  CreatePostInput,
  PostReadModel
> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: PostRepositoryPort,
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
    private readonly postReadModelHydrator: PostReadModelHydratorService,
  ) {}

  async execute(input: CreatePostInput): Promise<PostReadModel> {
    const normalizedTripId = input.tripId?.trim();

    if (normalizedTripId) {
      const trip = await this.tripRepository.findByIdForUser({
        tripId: normalizedTripId,
        userId: input.userId,
      });

      if (trip === null) {
        throw tripNotFoundException();
      }

      if (trip.visibility !== 'public') {
        throw new BadRequestException(
          'Trip must be public before creating a community post.',
        );
      }
    }

    try {
      const post = Post.create({
        userId: input.userId,
        title: input.title,
        content: input.content,
        coverImageUrl: input.coverImageUrl,
        tripId: normalizedTripId,
        visibility: 'public',
      });
      const createdPost = await this.postRepository.create({
        userId: post.userId,
        tripId: post.tripId,
        title: post.title,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        visibility: post.visibility,
      });

      return await this.postReadModelHydrator.hydrate(createdPost);
    } catch (error) {
      rethrowPostDomainError(error);
    }
  }
}
