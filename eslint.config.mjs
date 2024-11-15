import apify from '@apify/eslint-config';

// eslint-disable-next-line import/no-default-export
export default [
    { ignores: ['**/dist'] }, // Ignores need to happen first
    ...apify,
    {
        languageOptions: {
            sourceType: 'module',

            parserOptions: {
                project: 'tsconfig.eslint.json',
            },
        },
    },
    {
        rules: {
            "no-void": "off",
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];