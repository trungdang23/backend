import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
  setupFiles: ['<rootDir>/test/test-env.setup.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
};

export default config;
