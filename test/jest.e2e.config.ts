import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  displayName: 'e2e',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
  setupFiles: ['<rootDir>/test/test-env.setup.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
};

export default config;
