import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../modules/auth/auth.module';
import { BudgetsModule } from '../modules/budgets/budgets.module';
import { HealthModule } from '../modules/health/health.module';
import { JournalModule } from '../modules/journal/journal.module';
import { PlanningModule } from '../modules/planning/planning.module';
import { PostsModule } from '../modules/posts/posts.module';
import { TripsModule } from '../modules/trips/trips.module';
import { UsersModule } from '../modules/users/users.module';
import { PrismaModule } from '../shared/infrastructure/prisma/prisma.module';
import { AppConfigService } from './config/app-config.service';
import { appConfigSchema } from './config/app-config.schema';
import { configuration } from './config/configuration';
import { resolveEnvFilePaths } from './config/resolve-env-file-paths';
import { AppLogger } from './logging/app-logger.service';
import { RequestContextModule } from './request-context/request-context.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: resolveEnvFilePaths(),
      load: [configuration],
      validationSchema: appConfigSchema,
    }),
    RequestContextModule,
    PrismaModule,
    AuthModule,
    BudgetsModule,
    HealthModule,
    JournalModule,
    PlanningModule,
    PostsModule,
    TripsModule,
    UsersModule,
  ],
  providers: [AppConfigService, AppLogger],
})
export class AppModule {}
