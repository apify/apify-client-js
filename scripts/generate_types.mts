/**
 * Generates `src/generated/api.ts` from the OpenAPI specification downloaded into `tmp/openapi.json`.
 *
 * Run via `pnpm generate:types`, which downloads the specification first and records its version afterwards.
 * Requires a Node release that strips TypeScript syntax natively (>=22.18 or >=23.6).
 *
 * A path can be passed instead, for a candidate specification that is not published yet. The recorded version
 * deliberately stays put in that case -- it names the published specification -- so types generated that way must
 * not be committed.
 *
 * The `openapi-typescript` CLI cannot be used directly because two postprocessing steps need the Node API. Both
 * live in `./spec_transform.mts`, where they are unit tested:
 *
 *   1. `format: date-time` -> `Date`, because the client converts every `*At` field of a response into a `Date` at
 *      runtime and documents that as a public contract, while `openapi-typescript` types those fields as `string`.
 *   2. Absolutizing root-relative Markdown links in the specification's descriptions, which are copied verbatim
 *      into JSDoc and would otherwise resolve against the docs site's API-reference `baseUrl`.
 */

import { writeFile } from 'node:fs/promises';

import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

import { absolutizeDocLinks, transformDateTime } from './spec_transform.mts';

const DEFAULT_SPEC_PATH = new URL('../tmp/openapi.json', import.meta.url);

// `api.ts` rather than `api.d.ts` on purpose: `tsc` does not copy `.d.ts` inputs into `outDir`, so a declaration
// file would leave every published type referencing a path that does not exist in `dist`.
const OUTPUT_PATH = new URL('../src/generated/api.ts', import.meta.url);

const [inputPath] = process.argv.slice(2);
const specPath = inputPath === undefined ? DEFAULT_SPEC_PATH : new URL(inputPath, `file://${process.cwd()}/`);

const ast = await openapiTS(specPath, {
    transform: transformDateTime,
    // `additionalProperties` is deliberately left off. It is often described as the analogue of the Python
    // client's `extra_fields = "allow"`, but it is not: that setting relaxes *runtime* validation, whereas this
    // flag appends `& { [key: string]: unknown }` to every object and so relaxes *static* typing. This client
    // never validates responses at runtime (`cast()` is `input as T`), so unknown server fields already pass
    // through untouched -- the flag would add no forward compatibility and would silently make every property
    // typo type-check.
    emptyObjectsUnknown: true,
    rootTypes: true,
    rootTypesNoSchemaPrefix: true,
    rootTypesKeepCasing: true,
    silent: true,
});

await writeFile(OUTPUT_PATH, absolutizeDocLinks(COMMENT_HEADER + astToString(ast)));

console.log(`Wrote src/generated/api.ts from ${inputPath ?? 'tmp/openapi.json'}.`);

if (inputPath !== undefined) {
    console.log(
        'Generated from an explicit file - `apify.openapiSpec.version` in package.json still names the published ' +
            'specification, so do not commit these types.',
    );
}
