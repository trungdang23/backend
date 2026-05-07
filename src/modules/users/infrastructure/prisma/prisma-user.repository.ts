import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { User } from '../../application/user';
import type { UserRepositoryPort } from '../../application/ports/user-repository.port';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByAvatarPublicId(publicId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { avatarPublicId: publicId },
    });
  }

  async create(input: {
    email: string;
    passwordHash: string;
    displayName?: string | null;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName ?? null,
      },
    });
  }

  async updateProfile(input: {
    userId: string;
    displayName: string | null;
  }): Promise<User | null> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
    });

    if (existingUser === null) {
      return null;
    }

    return this.prisma.user.update({
      where: {
        id: input.userId,
      },
      data: {
        displayName: input.displayName,
      },
    });
  }

  async updateAvatar(input: {
    userId: string;
    fileName: string;
    contentType: string;
    byteSize: number;
    storageKey: string;
    publicId: string;
  }): Promise<{ user: User; previousStorageKey: string | null } | null> {
    return this.prisma.$transaction(async (prisma) => {
      const existingUser = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
      });

      if (existingUser === null) {
        return null;
      }

      const user = await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          avatarFileName: input.fileName,
          avatarContentType: input.contentType,
          avatarByteSize: input.byteSize,
          avatarStorageKey: input.storageKey,
          avatarPublicId: input.publicId,
        },
      });

      return {
        user,
        previousStorageKey: existingUser.avatarStorageKey,
      };
    });
  }

  async clearAvatar(input: {
    userId: string;
  }): Promise<{ user: User; previousStorageKey: string | null } | null> {
    return this.prisma.$transaction(async (prisma) => {
      const existingUser = await prisma.user.findUnique({
        where: {
          id: input.userId,
        },
      });

      if (existingUser === null) {
        return null;
      }

      const user = await prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          avatarFileName: null,
          avatarContentType: null,
          avatarByteSize: null,
          avatarStorageKey: null,
          avatarPublicId: null,
        },
      });

      return {
        user,
        previousStorageKey: existingUser.avatarStorageKey,
      };
    });
  }
}
