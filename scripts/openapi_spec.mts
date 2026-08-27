/**
 * Fetch the published Apify API OpenAPI specification and record the version the types were generated from.
 *
 * `fetch` downloads the specification into git-ignored `tmp/`, and `pnpm generate:types` reads that one copy, so a
 * specification redeployed mid-run cannot leave the generated types describing two different inputs. The document
 * itself is never committed -- only its version is, in `apify.openapiSpec.version` in `package.json`.
 *
 * `record-version` writes that stamp last, once generation succeeded, so it names the specification the committed
 * `src/generated/api.ts` follows from. `recorded-version` prints it; the nightly workflow reads it before
 * regenerating to report whether the stamp moved.
 *
 * The stamp is a coarse marker, not a content identity: the specification is served latest-only, so it cannot be
 * fetched back, and apify-docs bumps it in a follow-up `[skip ci]` commit, so a deploy can publish new content
 * under the old stamp. What keeps the value honest is the nightly workflow committing nothing unless the generated
 * types changed. A local regeneration that only moves this line is that same case -- drop it rather than
 * committing it alone.
 *
 * Maintainer-only: the generated types are committed, so nothing in the published package or in pull-request CI
 * depends on `docs.apify.com` being reachable.
 *
 * Needs Node 22.18+ or 23.6+ for native type stripping -- above the floor the package itself supports. Older
 * versions fail while parsing this file, with `ERR_UNKNOWN_FILE_EXTENSION` and no mention of a version.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** The published, bundled specification, built and deployed from the `apify/apify-docs` repository. */
const SPEC_URL = 'https://docs.apify.com/api/openapi.json';

/** Codegen input, deliberately outside version control -- `tmp/` is git-ignored. */
const SPEC_DIR = new URL('../tmp/', import.meta.url);
const SPEC_PATH = new URL('openapi.json', SPEC_DIR);

const MANIFEST_PATH = new URL('../package.json', import.meta.url);
const VERSION_ENTRY = 'apify.openapiSpec.version';

/**
 * Patches the recorded stamp in place, so the rest of `package.json` stays byte for byte as the release tooling
 * left it. Bounded to the `openapiSpec` object by `[^{}]`, so a missing key fails loudly instead of hitting some
 * other `version` further down the file.
 */
const VERSION_ENTRY_PATTERN = /("openapiSpec"\s*:\s*\{[^{}]*?"version"\s*:\s*")[^"]*(")/u;

/** Generous for 1 MB on a slow link, but bounded, so a stalled connection still reports. */
const TIMEOUT_MS = 60_000;

/** The nightly workflow alerts the team when this fails, so a single network blip should not be worth a ping. */
const DOWNLOAD_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5_000;

/** An error page or a truncated response must never be generated from; the real specification is roughly 1 MB. */
const MIN_SPEC_SIZE_BYTES = 100_000;

/** The fields this script reads out of a specification and reports on. */
interface SpecSummary {
    openapi: string;
    version: string;
    pathCount: number;
    schemaCount: number;
}

/** A failure this script diagnosed itself, so the top level can report it without a stack trace. */
class SpecError extends Error {}

function fail(message: string): never {
    throw new SpecError(message);
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
}

/**
 * Reject anything that is not an OpenAPI 3.1 document with content in it, before it is generated from.
 *
 * A docs redeploy serving an error page with a 200, a response truncated mid-flight or a specification version bump
 * has to stop here, or it lands as a diff that looks like an API change. Shape only: a well-formed specification
 * that lost most of its endpoints still passes, which is what the printed counts are for.
 */
function summarize(body: Buffer): SpecSummary {
    if (body.length < MIN_SPEC_SIZE_BYTES) {
        fail(`specification is only ${body.length} bytes, which cannot be the real one`);
    }

    let document: unknown;

    try {
        document = JSON.parse(body.toString('utf8'));
    } catch (error) {
        fail(`specification is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!isNonEmptyObject(document)) {
        fail('specification is not a JSON object');
    }

    const { openapi, info, paths, components } = document;

    // Narrower than a major-version check on purpose: 3.0 and a hypothetical 3.2 both describe schemas differently
    // enough that the generated types would need a look.
    if (typeof openapi !== 'string' || !openapi.startsWith('3.1.')) {
        fail(`expected an OpenAPI 3.1.x document, got \`openapi\`: ${JSON.stringify(openapi)}`);
    }

    const version = isNonEmptyObject(info) ? info.version : undefined;

    if (typeof version !== 'string' || version === '') {
        fail('specification has no `info.version` string');
    }

    // The stamp is spliced into `package.json` as the raw body of a JSON string, so a character that
    // would have to be escaped there must fail here rather than land as invalid JSON. `JSON.stringify`
    // escapes exactly those characters, so a difference from the naive quoting is the whole test.
    if (JSON.stringify(version) !== `"${version}"`) {
        fail(`\`info.version\` carries a character a JSON string cannot hold as-is: ${JSON.stringify(version)}`);
    }

    if (!isNonEmptyObject(paths)) {
        fail('`paths` is missing or empty');
    }

    if (!isNonEmptyObject(components) || !isNonEmptyObject(components.schemas)) {
        fail('`components.schemas` is missing or empty');
    }

    return {
        openapi,
        version,
        pathCount: Object.keys(paths).length,
        schemaCount: Object.keys(components.schemas).length,
    };
}

function describe(error: unknown): string {
    if (error instanceof SpecError) {
        return error.message;
    }

    // Node reports network failures as `TypeError: fetch failed` with the real reason on `cause`; the stack above it
    // is undici internals.
    if (error instanceof Error && error.cause instanceof Error) {
        return `${error.name}: ${error.message}: ${error.cause.message}`;
    }

    // `AbortSignal.timeout` rejects with a `DOMException` named `TimeoutError` and no `cause`, so a timeout needs
    // its own branch to avoid falling through to the stack one.
    if (error instanceof DOMException) {
        return `${error.name}: ${error.message}`;
    }

    // Undiagnosed -- a bug in this script, or an errno nothing here anticipated -- so keep the stack.
    if (error instanceof Error) {
        return error.stack ?? `${error.name}: ${error.message}`;
    }

    return String(error);
}

/** GETs the specification bytes, retrying transient failures. Does not write anything. */
async function download(): Promise<Buffer> {
    let lastError = '';

    for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
        try {
            const response = await fetch(SPEC_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });

            if (response.ok) {
                // `arrayBuffer` rather than `text`: `text` would strip a leading BOM and decode a non-UTF-8 body
                // into replacement characters that still parse as JSON.
                return Buffer.from(await response.arrayBuffer());
            }

            lastError = `HTTP ${response.status} ${response.statusText}`;

            // A rejection the client owns is not going to answer differently in five seconds. 408 and 429 are the
            // two that will, so they stay in the retry loop.
            if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
                fail(`failed to download ${SPEC_URL}: ${lastError}`);
            }
        } catch (error) {
            // The non-retryable branch above throws from inside this `try`, so its verdict has to travel
            // through here rather than being folded into `lastError` and retried anyway.
            if (error instanceof SpecError) throw error;

            lastError = describe(error);
        }

        console.error(`Attempt ${attempt}/${DOWNLOAD_ATTEMPTS} to download ${SPEC_URL} failed (${lastError}).`);

        if (attempt < DOWNLOAD_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }

    fail(`failed to download ${SPEC_URL} after ${DOWNLOAD_ATTEMPTS} attempts: ${lastError}`);
}

/** Reads the recorded stamp, failing loudly if the entry the writer targets is gone. */
async function readRecordedVersion(): Promise<string> {
    const manifest: unknown = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    const apify = isNonEmptyObject(manifest) ? manifest.apify : undefined;
    const spec = isNonEmptyObject(apify) ? apify.openapiSpec : undefined;
    const version = isNonEmptyObject(spec) ? spec.version : undefined;

    if (typeof version !== 'string' || version === '') {
        fail(`package.json has no \`${VERSION_ENTRY}\` string`);
    }

    return version;
}

/** Writes the downloaded specification to `tmp/openapi.json` for the generator to read. */
async function fetchSpec(): Promise<void> {
    const bytes = await download();
    const spec = summarize(bytes);

    // Written byte for byte, so the key order the generator sees is the published one.
    await mkdir(SPEC_DIR, { recursive: true });
    await writeFile(SPEC_PATH, bytes);

    console.log(`Wrote tmp/openapi.json (openapi ${spec.openapi}, version ${spec.version}, ${bytes.length} bytes).`);
    console.log(`Specification describes ${spec.pathCount} paths and ${spec.schemaCount} schemas.`);
}

/** Stamps the fetched specification's version into `package.json`, leaving the rest of the file untouched. */
async function recordVersion(): Promise<void> {
    const bytes = await readFile(SPEC_PATH).catch((error: unknown) => {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            fail('tmp/openapi.json is missing - run `pnpm generate:types` rather than this subcommand alone');
        }

        throw error;
    });

    const { version } = summarize(bytes);
    const previous = await readRecordedVersion();

    if (previous === version) {
        console.log(`Specification version ${version} is already recorded in package.json.`);
        return;
    }

    const manifest = await readFile(MANIFEST_PATH, 'utf8');
    // A replacer function rather than a `$1...$2` string: the version comes off the network, and a `$` sequence
    // in it would otherwise be read as a replacement pattern and rewrite the surrounding JSON.
    const patched = manifest.replace(
        VERSION_ENTRY_PATTERN,
        (_match, before: string, after: string) => `${before}${version}${after}`,
    );

    if (patched === manifest) {
        fail(`package.json has no \`${VERSION_ENTRY}\` entry - cannot record the version`);
    }

    await writeFile(MANIFEST_PATH, patched);
    console.log(`Recorded specification version in package.json: ${previous} -> ${version}.`);
}

/** Prints the recorded stamp on stdout, for the regeneration workflow to capture. */
async function printRecordedVersion(): Promise<void> {
    console.log(await readRecordedVersion());
}

const COMMANDS: Record<string, () => Promise<void>> = {
    fetch: fetchSpec,
    'record-version': recordVersion,
    'recorded-version': printRecordedVersion,
};

const [name] = process.argv.slice(2);
// `Object.hasOwn` rather than a plain lookup: `COMMANDS.toString` resolves through `Object.prototype`
// and would run as a no-op that exits 0.
const command = name !== undefined && Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;

if (command === undefined) {
    console.error(`openapi-spec: expected one of ${Object.keys(COMMANDS).join(', ')}, got ${JSON.stringify(name)}`);
    // `process.exitCode` rather than `process.exit`, which can exit before a piped stderr has drained.
    process.exitCode = 1;
} else {
    try {
        await command();
    } catch (error) {
        console.error(`openapi-spec: ${describe(error)}`);
        process.exitCode = 1;
    }
}
