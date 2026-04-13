import 'reflect-metadata';

import { createApp } from './app/bootstrap/create-app';
import { AppConfigService } from './app/config/app-config.service';
import { AppLogger } from './app/logging/app-logger.service';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get(AppConfigService);
  const logger = app.get(AppLogger);

  await app.listen(config.port);
  const url = await app.getUrl();

  logger.log(
    `Journey backend is running at ${url}/${config.globalPrefix}`,
    'Bootstrap',
  );
}

bootstrap().catch((error: unknown) => {
  const logger = new AppLogger();

  logger.error(
    'Failed to bootstrap Journey backend',
    error instanceof Error ? error.stack : undefined,
    'Bootstrap',
  );

  process.exit(1);
});
