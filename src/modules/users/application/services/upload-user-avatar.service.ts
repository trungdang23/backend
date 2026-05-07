import { randomUUID } from 'node:crypto';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { userProfileValidationException } from '../../../../app/errors/app-exceptions';
import type { UseCase } from '../../../../shared/application/use-case';
import { createUserAvatar } from '../../domain/user-avatar';
import type { UserAvatarContentType } from '../../domain/user-avatar';
import { toUserProfile, type UserProfile } from '../user-profile';
import {
  USER_AVATAR_STORAGE,
  type UserAvatarStoragePort,
} from '../ports/user-avatar-storage.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { rethrowUserProfileDomainError } from './map-user-profile-domain-error';

export interface UploadedUserAvatarFile {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  byteSize: number;
}

export interface UploadUserAvatarInput {
  userId: string;
  file: UploadedUserAvatarFile | null;
}

@Injectable()
export class UploadUserAvatarService
  implements UseCase<UploadUserAvatarInput, UserProfile>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(USER_AVATAR_STORAGE)
    private readonly avatarStorage: UserAvatarStoragePort,
  ) {}

  async execute(input: UploadUserAvatarInput): Promise<UserProfile> {
    if (input.file === null) {
      throw userProfileValidationException('Avatar file is required.');
    }

    try {
      const publicId = randomUUID();
      const avatarDraft = createUserAvatar({
        fileName: input.file.fileName,
        contentType: input.file.contentType,
        byteSize: input.file.byteSize,
        storageKey: 'pending-storage-key',
        publicId,
      });
      const savedFile = await this.avatarStorage.save({
        buffer: input.file.buffer,
        contentType: avatarDraft.contentType,
        publicId,
      });
      const avatar = createUserAvatar({
        fileName: avatarDraft.fileName,
        contentType: avatarDraft.contentType,
        byteSize: avatarDraft.byteSize,
        storageKey: savedFile.storageKey,
        publicId,
      });
      const result = await this.updateUserAvatarOrDeleteNewFile({
        avatar,
        userId: input.userId,
      });

      await this.deleteOldAvatarFile(result.previousStorageKey, avatar.storageKey);

      return toUserProfile(result.user);
    } catch (error) {
      rethrowUserProfileDomainError(error);
    }
  }

  private async updateUserAvatarOrDeleteNewFile(input: {
    avatar: {
      fileName: string;
      contentType: UserAvatarContentType;
      byteSize: number;
      storageKey: string;
      publicId: string;
    };
    userId: string;
  }) {
    try {
      const result = await this.userRepository.updateAvatar({
        userId: input.userId,
        fileName: input.avatar.fileName,
        contentType: input.avatar.contentType,
        byteSize: input.avatar.byteSize,
        storageKey: input.avatar.storageKey,
        publicId: input.avatar.publicId,
      });

      if (result === null) {
        await this.deleteFileBestEffort(input.avatar.storageKey);
        throw new NotFoundException('User was not found.');
      }

      return result;
    } catch (error) {
      await this.deleteFileBestEffort(input.avatar.storageKey);
      throw error;
    }
  }

  private async deleteOldAvatarFile(
    previousStorageKey: string | null,
    nextStorageKey: string,
  ): Promise<void> {
    if (previousStorageKey === null || previousStorageKey === nextStorageKey) {
      return;
    }

    await this.deleteFileBestEffort(previousStorageKey);
  }

  private async deleteFileBestEffort(storageKey: string): Promise<void> {
    try {
      await this.avatarStorage.delete(storageKey);
    } catch {
      // Old avatar cleanup must not make the newly saved profile unusable.
    }
  }
}
