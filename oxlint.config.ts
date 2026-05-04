import { defineConfig } from '@apify/oxlint-config';

export default defineConfig({
    ignorePatterns: ['**/node_modules', '**/dist', 'coverage', 'website', '**/*.d.ts'],
    rules: {
        'typescript/no-explicit-any': 'off',
        'consistent-return': 'off',
        'no-use-before-define': 'off',
        'no-param-reassign': 'off',
        'no-void': 'off',
    },
    overrides: [
        {
            files: ['*.config.ts', '*.config.mts', '*.config.mjs'],
            rules: {
                'no-console': 'off',
                'import/no-default-export': 'off',
            },
        },
        {
            files: ['test/**'],
            rules: {
                'no-console': 'off',
                'no-useless-constructor': 'off',
                'typescript/ban-ts-comment': 'off',
                'typescript/no-empty-function': 'off',
                'typescript/no-unused-vars': 'off',
                'jest/no-conditional-expect': 'off',
                'vitest/no-conditional-expect': 'off',
                'jest/expect-expect': 'off',
                'vitest/expect-expect': 'off',
                'jest/no-standalone-expect': 'off',
                'vitest/no-standalone-expect': 'off',
            },
        },
    ],
});
