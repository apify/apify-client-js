/**
 * Generates `src/generated/schemas.ts` -- a zod schema per `components.schemas` entry -- from the OpenAPI
 * specification downloaded into `tmp/openapi.json`.
 *
 * Run via `pnpm generate:models`, which downloads the specification first, generates the types next to these
 * schemas, and records the specification version afterwards. Requires a Node release that strips TypeScript
 * syntax natively (>=22.18 or >=23.6).
 *
 * A path can be passed instead, for a candidate specification that is not published yet. The recorded version
 * deliberately stays put in that case -- it names the published specification -- so schemas generated that way
 * must not be committed.
 *
 * The same two spec-level fixes as for the types apply: a `required` next to a `$ref` is hoisted before the
 * emitter sees the document, and root-relative Markdown links in the emitted doc comments are absolutized.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { emitSchemas, type OpenApiDocument } from './schema_emitter.mts';
import { absolutizeDocLinks, hoistAllOfRequired } from './spec_transform.mts';

const DEFAULT_SPEC_PATH = new URL('../tmp/openapi.json', import.meta.url);

const OUTPUT_PATH = new URL('../src/generated/schemas.ts', import.meta.url);

const [inputPath] = process.argv.slice(2);
const specPath = inputPath === undefined ? DEFAULT_SPEC_PATH : pathToFileURL(resolve(inputPath));

const spec = hoistAllOfRequired(JSON.parse(await readFile(specPath, 'utf8')) as OpenApiDocument);

await writeFile(OUTPUT_PATH, absolutizeDocLinks(emitSchemas(spec)));

console.log(`Wrote src/generated/schemas.ts from ${inputPath ?? 'tmp/openapi.json'}.`);

if (inputPath !== undefined) {
    console.log(
        'Generated from an explicit file - `apify.openapiSpec.version` in package.json still names the published ' +
            'specification, so do not commit these schemas.',
    );
}
