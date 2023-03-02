import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'test/tsconfig.json',
            isolatedModules: true,
        }],
    },
    testTimeout: 20_000,
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.js',
        '!**/node_modules/**',
    ],
    maxWorkers: 3,
});
