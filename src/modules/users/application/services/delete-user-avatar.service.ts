import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { toUserProfile, type UserProfile } from '../user-profile';
import {
  USER_AVATAR_STORAGE,
  type UserAvatarStoragePort,
} from '../ports/user-avatar-storage.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';

export interface DeleteUserAvatarInput {
  userId: string;
}

@Injectable()
export class DeleteUserAvatarService
  implements UseCase<DeleteUserAvatarInput, UserProfile>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(USER_AVATAR_STORAGE)
    private readonly avatarStorage: UserAvatarStoragePort,
  ) {}

  async execute(input: DeleteUserAvatarInput): Promise<UserProfile> {
    const result = await this.userRepository.clearAvatar({
      userId: input.userId,
    });

    if (result === null) {
      throw new NotFoundException('User was not found.');
    }

    if (result.previousStorageKey !== null) {
      try {
        await this.avatarStorage.delete(result.previousStorageKey);
      } catch {
        // A missing or temporarily locked old file should not block fallback avatar use.
      }
    }

    return toUserProfile(result.user);
  }
}
