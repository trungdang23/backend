import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { RegisterUserService } from './application/services/register-user.service';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { Pbkdf2PasswordHasherService } from './infrastructure/security/pbkdf2-password-hasher.service';
import { PrismaUserRepository } from './infrastructure/prisma/prisma-user.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    RegisterUserService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Pbkdf2PasswordHasherService,
    },
  ],
  exports: [RegisterUserService, USER_REPOSITORY, PASSWORD_HASHER],
})
export class UsersModule {}
