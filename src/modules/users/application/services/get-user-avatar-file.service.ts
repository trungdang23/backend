import { Inject, Injectable } from '@nestjs/common';

import { userAvatarNotFoundException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import {
  isSupportedUserAvatarContentType,
  type UserAvatarContentType,
} from '../../domain/user-avatar';
import {
  USER_AVATAR_STORAGE,
  type UserAvatarFile,
  type UserAvatarStoragePort,
} from '../ports/user-avatar-storage.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';

export interface GetUserAvatarFileInput {
  publicId: string;
}

export interface GetUserAvatarFileResult {
  contentType: UserAvatarContentType;
  file: UserAvatarFile;
}

@Injectable()
export class GetUserAvatarFileService
  implements UseCase<GetUserAvatarFileInput, GetUserAvatarFileResult>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(USER_AVATAR_STORAGE)
    private readonly avatarStorage: UserAvatarStoragePort,
  ) {}

  async execute(
    input: GetUserAvatarFileInput,
  ): Promise<GetUserAvatarFileResult> {
    const user = await this.userRepository.findByAvatarPublicId(input.publicId);

    if (
      user === null ||
      user.avatarStorageKey === undefined ||
      user.avatarStorageKey === null ||
      user.avatarContentType === undefined ||
      user.avatarContentType === null ||
      !isSupportedUserAvatarContentType(user.avatarContentType)
    ) {
      throw userAvatarNotFoundException();
    }

    const file = await this.avatarStorage.read(user.avatarStorageKey);

    if (file === null) {
      throw userAvatarNotFoundException();
    }

    return {
      contentType: user.avatarContentType,
      file,
    };
  }
}
