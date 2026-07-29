/**
 * Generates `src/generated/api.ts` from the committed OpenAPI snapshot in `src/generated/openapi.json`.
 *
 * Run via `pnpm generate:types`. Requires a Node release that strips TypeScript syntax natively
 * (>=22.18 or >=24); the `generated_types` CI job pins Node 24.
 *
 * The CLI cannot be used directly because two postprocessing steps need the Node API. Both live in
 * `./spec_transform.mts`, where they are unit tested:
 *
 *   1. `format: date-time` -> `Date`, because the client converts every `*At` field of a response into a
 *      `Date` at runtime and documents that as a public contract, while `openapi-typescript` types those
 *      fields as `string`.
 *   2. Absolutizing root-relative Markdown links in the spec's descriptions, which are copied verbatim into
 *      JSDoc and would otherwise resolve against the docs site's API-reference `baseUrl`.
 *
 * Pass `--check` to verify the committed output is up to date without writing anything.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

import { absolutizeDocLinks, transformDateTime } from './spec_transform.mts';

const SPEC_URL = new URL('../src/generated/openapi.json', import.meta.url);
const OUTPUT_URL = new URL('../src/generated/api.ts', import.meta.url);

async function generate(): Promise<string> {
    const ast = await openapiTS(SPEC_URL, {
        transform: transformDateTime,
        // `additionalProperties` is deliberately left off. It is often described as the analogue of the
        // Python client's `extra_fields = "allow"`, but it is not: that setting relaxes *runtime*
        // validation, whereas this flag appends `& { [key: string]: unknown }` to every object and so
        // relaxes *static* typing. This client never validates responses at runtime (`cast()` is
        // `input as T`), so unknown server fields already pass through untouched -- the flag would add no
        // forward compatibility and would silently make every property typo type-check.
        emptyObjectsUnknown: true,
        rootTypes: true,
        rootTypesNoSchemaPrefix: true,
        rootTypesKeepCasing: true,
        silent: true,
    });

    return absolutizeDocLinks(COMMENT_HEADER + astToString(ast));
}

const generated = await generate();
const outputPath = fileURLToPath(OUTPUT_URL);

if (argv.includes('--check')) {
    let committed: string;

    try {
        committed = readFileSync(outputPath, 'utf8');
    } catch {
        console.error('src/generated/api.ts is missing. Run `pnpm generate:types`.');
        exit(1);
    }

    if (committed !== generated) {
        console.error(
            'src/generated/api.ts is out of sync with src/generated/openapi.json.\n' +
                'Run `pnpm generate:types` and commit the result.',
        );
        exit(1);
    }

    console.log('src/generated/api.ts is up to date.');
} else {
    writeFileSync(outputPath, generated);
    console.log(`Wrote ${outputPath}`);
}
