import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UseCase } from '../../../../shared/application/use-case';
import { toUserProfile, type UserProfile } from '../user-profile';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';

export interface GetUserProfileInput {
  userId: string;
}

@Injectable()
export class GetUserProfileService implements UseCase<
  GetUserProfileInput,
  UserProfile
> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: GetUserProfileInput): Promise<UserProfile> {
    const user = await this.userRepository.findById(input.userId);

    if (user === null) {
      throw new NotFoundException('User was not found.');
    }

    return toUserProfile(user);
  }
}
