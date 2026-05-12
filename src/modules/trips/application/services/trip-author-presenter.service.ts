import { Inject, Injectable } from '@nestjs/common';

import type { User } from '../../../users/application/user';
import { buildUserAvatarPath } from '../../../users/application/user-profile';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../../users/application/ports/user-repository.port';
import type { Trip } from '../../domain/trip';

export interface TripAuthorSummary {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

@Injectable()
export class TripAuthorPresenterService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async present(trip: Trip): Promise<TripAuthorSummary> {
    const user = await this.userRepository.findById(trip.userId);

    return this.toAuthorSummary(trip.userId, user);
  }

  async presentMany(trips: Trip[]): Promise<Map<string, TripAuthorSummary>> {
    const userIds = Array.from(new Set(trips.map((trip) => trip.userId)));
    const userEntries = await Promise.all(
      userIds.map(async (userId) => [
        userId,
        await this.userRepository.findById(userId),
      ] as const),
    );
    const usersById = new Map(userEntries);

    return new Map(
      trips.map((trip) => [
        trip.id,
        this.toAuthorSummary(trip.userId, usersById.get(trip.userId) ?? null),
      ]),
    );
  }

  private toAuthorSummary(
    userId: string,
    user: User | null,
  ): TripAuthorSummary {
    return {
      id: userId,
      displayName: user?.displayName ?? null,
      avatarUrl:
        user?.avatarPublicId === undefined || user.avatarPublicId === null
          ? null
          : buildUserAvatarPath(user.avatarPublicId),
    };
  }
}
