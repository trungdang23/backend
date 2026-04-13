import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { AppConfigService } from '../../../app/config/app-config.service';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';

export interface HealthSnapshot {
  status: 'ok';
  service: string;
  environment: string;
  version: string;
  timestamp: string;
  checks: {
    database: {
      status: 'up';
    };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: AppConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async getSnapshot(): Promise<HealthSnapshot> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is unavailable',
      });
    }

    return {
      status: 'ok',
      service: this.configService.appName,
      environment: this.configService.nodeEnv,
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'up',
        },
      },
    };
  }
}
