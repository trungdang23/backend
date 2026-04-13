import { Module } from '@nestjs/common';

import { AppConfigService } from '../../app/config/app-config.service';
import { HealthService } from './application/health.service';
import { HealthController } from './presentation/health.controller';

@Module({
  controllers: [HealthController],
  providers: [HealthService, AppConfigService],
})
export class HealthModule {}
