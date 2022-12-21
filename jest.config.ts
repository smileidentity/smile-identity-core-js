import type {Config} from 'jest';
import {defaults} from 'jest-config';

const config: Config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist']
};

export default config;