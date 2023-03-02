module.exports = {
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
        '<rootDir>/src/**/*.[jt]s',
    ],
    maxWorkers: 3,
};
