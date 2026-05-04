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
                // Tests use the `try { await ... } catch (err) { expect(err)... }` pattern.
                // Migrating to `await expect(...).rejects.toX(...)` is out of scope for the
                // lint migration — follow-up to enable.
                'jest/no-conditional-expect': 'off',
                'vitest/no-conditional-expect': 'off',
                // A handful of helper-based tests have no direct `expect` (assertions live in
                // the helper). Same follow-up to clean up.
                'jest/expect-expect': 'off',
                'vitest/expect-expect': 'off',
                // Some cross-test helper functions call `expect` outside an explicit test block.
                'jest/no-standalone-expect': 'off',
                'vitest/no-standalone-expect': 'off',
            },
        },
    ],
});
