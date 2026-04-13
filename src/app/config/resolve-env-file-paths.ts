import type { NodeEnvironment } from './app-config';

export function resolveEnvFilePaths(): string[] {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnvironment;

  return [`.env.${nodeEnv}`];
}
