import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { AppConfigService } from '../../../../src/app/config/app-config.service';
import { PASSWORD_HASHER } from '../../../../src/modules/users/application/ports/password-hasher.port';
import { USER_REPOSITORY } from '../../../../src/modules/users/application/ports/user-repository.port';
import { USER_AVATAR_STORAGE } from '../../../../src/modules/users/application/ports/user-avatar-storage.port';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { LocalUserAvatarStorage } from '../../../../src/modules/users/infrastructure/storage/local-user-avatar.storage';

describe('UsersModule', () => {
  it('provides avatar storage with AppConfigService available', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        UsersModule,
      ],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue({})
      .overrideProvider(PASSWORD_HASHER)
      .useValue({})
      .compile();

    try {
      expect(moduleRef.get(AppConfigService)).toBeInstanceOf(AppConfigService);
      expect(moduleRef.get(USER_AVATAR_STORAGE)).toBeInstanceOf(
        LocalUserAvatarStorage,
      );
    } finally {
      await moduleRef.close();
    }
  });
});
