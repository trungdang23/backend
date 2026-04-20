import { Inject, Injectable } from '@nestjs/common';

import type { UserRepositoryPort } from '../../../users/application/ports/user-repository.port';
import { USER_REPOSITORY } from '../../../users/application/ports/user-repository.port';
import type { TripRepositoryPort } from '../../../trips/application/ports/trip-repository.port';
import { TRIP_REPOSITORY } from '../../../trips/application/ports/trip-repository.port';
import { Post } from '../../domain/post';
import type { PostReadModel } from '../post-read-model';

@Injectable()
export class PostReadModelHydratorService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async hydrate(post: Post): Promise<PostReadModel> {
    const [author, trip] = await Promise.all([
      this.userRepository.findById(post.userId),
      post.tripId === null ? Promise.resolve(null) : this.tripRepository.findById(post.tripId),
    ]);

    return {
      id: post.id,
      userId: post.userId,
      tripId: post.tripId,
      title: post.title,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      visibility: post.visibility,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.userId,
        displayName: author?.displayName ?? null,
      },
      trip:
        trip !== null && trip.visibility === 'public'
          ? {
              id: trip.id,
              name: trip.name,
              coverImageUrl: trip.coverImageUrl,
            }
          : null,
    };
  }

  async hydrateMany(posts: Post[]): Promise<PostReadModel[]> {
    const authorIds = Array.from(new Set(posts.map((post) => post.userId)));
    const tripIds = Array.from(
      new Set(
        posts
          .map((post) => post.tripId)
          .filter((tripId): tripId is string => tripId !== null),
      ),
    );

    const authorEntries = await Promise.all(
      authorIds.map(async (authorId) => [
        authorId,
        await this.userRepository.findById(authorId),
      ] as const),
    );
    const tripEntries = await Promise.all(
      tripIds.map(async (tripId) => [
        tripId,
        await this.tripRepository.findById(tripId),
      ] as const),
    );

    const authorMap = new Map(authorEntries);
    const tripMap = new Map(tripEntries);

    return posts.map((post) => {
      const author = authorMap.get(post.userId) ?? null;
      const trip = post.tripId === null ? null : (tripMap.get(post.tripId) ?? null);

      return {
        id: post.id,
        userId: post.userId,
        tripId: post.tripId,
        title: post.title,
        content: post.content,
        coverImageUrl: post.coverImageUrl,
        visibility: post.visibility,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.userId,
          displayName: author?.displayName ?? null,
        },
        trip:
          trip !== null && trip.visibility === 'public'
            ? {
                id: trip.id,
                name: trip.name,
                coverImageUrl: trip.coverImageUrl,
              }
            : null,
      };
    });
  }
}
