import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { AppLogger } from '../logging/app-logger.service';
import { setupApp } from './setup-app';

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(AppLogger));
  setupApp(app);

  return app;
}
