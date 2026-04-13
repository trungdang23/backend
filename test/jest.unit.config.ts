import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  setupFiles: ['<rootDir>/test/test-env.setup.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/main.ts'],
};

export default config;
