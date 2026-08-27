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
 * The `openapi-typescript` CLI cannot be used directly because three postprocessing steps need the Node API. All
 * three live in `./spec_transform.mts`, where they are unit tested:
 *
 *   1. `format: date-time` -> `Date`, because the client converts every `*At` field of a response into a `Date` at
 *      runtime and documents that as a public contract, while `openapi-typescript` types those fields as `string`.
 *   2. Absolutizing root-relative Markdown links in the specification's descriptions, which are copied verbatim
 *      into JSDoc and would otherwise resolve against the docs site's API-reference `baseUrl`.
 *   3. Hoisting a `required` that the specification states next to a `$ref`, which the generator would otherwise
 *      drop. This one runs over the specification itself, before generation, rather than over its output.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { OpenAPI3 } from 'openapi-typescript';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

import { absolutizeDocLinks, hoistRefSiblingRequired, transformDateTime } from './spec_transform.mts';

const DEFAULT_SPEC_PATH = new URL('../tmp/openapi.json', import.meta.url);

// `api.ts` rather than `api.d.ts` on purpose: `tsc` does not copy `.d.ts` inputs into `outDir`, so a declaration
// file would leave every published type referencing a path that does not exist in `dist`.
const OUTPUT_PATH = new URL('../src/generated/api.ts', import.meta.url);

const [inputPath] = process.argv.slice(2);
const specPath = inputPath === undefined ? DEFAULT_SPEC_PATH : pathToFileURL(resolve(inputPath));

// Read and rewritten here rather than handed over as a path, because the hoist has to happen before the
// generator sees the document.
const spec = hoistRefSiblingRequired(JSON.parse(await readFile(specPath, 'utf8')) as OpenAPI3);

// Two options are deliberately left off. `additionalProperties` is often described as the analogue of the Python
// client's `extra_fields = "allow"`, but it is not: that setting relaxes *runtime* validation, whereas this flag
// appends `& { [key: string]: unknown }` to every object and so relaxes *static* typing. This client never
// validates responses at runtime (`cast()` is `input as T`), so unknown server fields already pass through
// untouched -- the flag would add no forward compatibility and would silently make every property typo
// type-check. `rootTypes` would emit `export type Dataset = components['schemas']['Dataset']` aliases that
// collide by name with the published models, and since both consumers of this file go through `components`, they
// would be 300-odd exported lines nothing imports.
const ast = await openapiTS(spec, {
    transform: transformDateTime,
    // A schema of `{}` describes an unconstrained object, so it is typed as `unknown` rather than the
    // `Record<string, never>` the generator emits by default.
    emptyObjectsUnknown: true,
    // On by default, which makes a property carrying a schema `default` non-optional. A default says what
    // the server fills in when a request omits the field, and is no promise that a response carries it:
    // what a response is guaranteed to carry is its `required` list and nothing else. So a defaulted field
    // the schema does not require stays optional here. `Actor.isSourceCodeHidden` is the one today.
    defaultNonNullable: false,
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
