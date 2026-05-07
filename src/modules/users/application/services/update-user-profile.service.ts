import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { userProfileValidationException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import { toUserProfile, type UserProfile } from '../user-profile';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';

export interface UpdateUserProfileInput {
  userId: string;
  displayName: string;
}

@Injectable()
export class UpdateUserProfileService
  implements UseCase<UpdateUserProfileInput, UserProfile>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: UpdateUserProfileInput): Promise<UserProfile> {
    const displayName = input.displayName.trim();

    if (displayName.length === 0) {
      throw userProfileValidationException('Display name is required.');
    }

    if (displayName.length > 80) {
      throw userProfileValidationException(
        'Display name must be at most 80 characters.',
      );
    }

    const user = await this.userRepository.updateProfile({
      userId: input.userId,
      displayName,
    });

    if (user === null) {
      throw new NotFoundException('User was not found.');
    }

    return toUserProfile(user);
  }
}
