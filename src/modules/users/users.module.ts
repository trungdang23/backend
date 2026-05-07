import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { DeleteUserAvatarService } from './application/services/delete-user-avatar.service';
import { GetUserAvatarFileService } from './application/services/get-user-avatar-file.service';
import { GetUserProfileService } from './application/services/get-user-profile.service';
import { RegisterUserService } from './application/services/register-user.service';
import { UpdateUserProfileService } from './application/services/update-user-profile.service';
import { UploadUserAvatarService } from './application/services/upload-user-avatar.service';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { USER_AVATAR_STORAGE } from './application/ports/user-avatar-storage.port';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { Pbkdf2PasswordHasherService } from './infrastructure/security/pbkdf2-password-hasher.service';
import { PrismaUserRepository } from './infrastructure/prisma/prisma-user.repository';
import { LocalUserAvatarStorage } from './infrastructure/storage/local-user-avatar.storage';
import { UserAvatarController } from './presentation/user-avatar.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserAvatarController],
  providers: [
    DeleteUserAvatarService,
    GetUserAvatarFileService,
    GetUserProfileService,
    RegisterUserService,
    UpdateUserProfileService,
    UploadUserAvatarService,
    {
      provide: USER_AVATAR_STORAGE,
      useClass: LocalUserAvatarStorage,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Pbkdf2PasswordHasherService,
    },
  ],
  exports: [
    DeleteUserAvatarService,
    GetUserAvatarFileService,
    GetUserProfileService,
    RegisterUserService,
    UpdateUserProfileService,
    UploadUserAvatarService,
    USER_AVATAR_STORAGE,
    USER_REPOSITORY,
    PASSWORD_HASHER,
  ],
})
export class UsersModule {}
