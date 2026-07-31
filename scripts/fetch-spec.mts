/**
 * Refresh the vendored Apify API OpenAPI snapshot at `spec/openapi.json`.
 *
 * Run with `pnpm spec:fetch`. Maintainer-only: the snapshot is committed, so nothing in the published package
 * or in CI depends on `docs.apify.com` being reachable.
 *
 * Needs Node 22.18+ or 23.6+ for native type stripping -- above the floor the package itself supports. Older
 * versions fail while parsing this file, with `ERR_UNKNOWN_FILE_EXTENSION` and no mention of a version.
 *
 * The snapshot lives outside `src/` because it is a build input, not source: `resolveJsonModule` is on, so a
 * stray import from `src/` would emit the whole 1 MB document into `dist/` and ship it.
 *
 * The response bytes are written through untouched rather than re-serialized, which keeps refreshes free of
 * formatting-only diffs.
 */

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';

const SPEC_URL = 'https://docs.apify.com/api/openapi.json';
const SPEC_DIR = new URL('../spec/', import.meta.url);
const TARGET = new URL('openapi.json', SPEC_DIR);
const TEMP = new URL('openapi.json.tmp', SPEC_DIR);

/** Generous for 1 MB on a slow link, but bounded, so a stalled connection still reports. */
const TIMEOUT_MS = 30_000;

/** The fields this script reads out of a spec and reports on. */
interface SpecSummary {
    openapi: string;
    version: string;
    pathCount: number;
    schemaCount: number;
}

/** A failure this script diagnosed itself, so the top level can report it without a stack trace. */
class SpecFetchError extends Error {}

function fail(message: string): never {
    throw new SpecFetchError(message);
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0;
}

/** Read `info.version` out of an already-parsed document, tolerating anything missing or misshapen. */
function versionIn(document: unknown): string {
    const info = isNonEmptyObject(document) ? document.info : undefined;

    return isNonEmptyObject(info) && typeof info.version === 'string' ? info.version : '<unknown>';
}

/**
 * Reject anything that is not an OpenAPI 3.1 document with content in it, before the snapshot is touched.
 *
 * A docs redeploy serving an error page with a 200, a response truncated mid-flight or a spec version bump has
 * to stop here, or it lands as a diff that looks like an API change. Shape only: a well-formed spec that lost
 * most of its endpoints still passes, which is what the printed counts are for.
 */
function summarize(body: string): SpecSummary {
    let document: unknown;

    try {
        document = JSON.parse(body);
    } catch (error) {
        fail(`response body is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!isNonEmptyObject(document)) {
        fail('response body is not a JSON object');
    }

    const { openapi, paths, components } = document;

    // Narrower than a major-version check on purpose: 3.0 and a hypothetical 3.2 both describe schemas
    // differently enough that the generated types would need a look.
    if (typeof openapi !== 'string' || !openapi.startsWith('3.1.')) {
        fail(`expected an OpenAPI 3.1.x document, got \`openapi\`: ${JSON.stringify(openapi)}`);
    }

    if (!isNonEmptyObject(paths)) {
        fail('`paths` is missing or empty');
    }

    if (!isNonEmptyObject(components) || !isNonEmptyObject(components.schemas)) {
        fail('`components.schemas` is missing or empty');
    }

    return {
        openapi,
        version: versionIn(document),
        pathCount: Object.keys(paths).length,
        schemaCount: Object.keys(components.schemas).length,
    };
}

/** Baseline for the transition lines. The snapshot may have been hand-edited, so a failure here is not fatal. */
function summarizeOnDisk(snapshot: Buffer): SpecSummary | null {
    try {
        return summarize(snapshot.toString('utf8'));
    } catch {
        return null;
    }
}

function report(error: unknown): string {
    if (error instanceof SpecFetchError) {
        return error.message;
    }

    // Node reports network failures as `TypeError: fetch failed` with the real reason on `cause`; the stack
    // above it is undici internals.
    if (error instanceof Error && error.cause instanceof Error) {
        return `${error.name}: ${error.message}: ${error.cause.message}`;
    }

    // `AbortSignal.timeout` rejects with a `DOMException` named `TimeoutError` and no `cause`, so a timeout
    // needs its own branch to avoid falling through to the stack one.
    if (error instanceof DOMException) {
        return `${error.name}: ${error.message}`;
    }

    // Undiagnosed -- a bug in this script, or an errno nothing here anticipated -- so keep the stack.
    if (error instanceof Error) {
        return error.stack ?? `${error.name}: ${error.message}`;
    }

    return String(error);
}

/** A missing snapshot is a normal state; any other read failure is not, so it must not be swallowed. */
async function snapshotOnDisk(): Promise<Buffer | null> {
    try {
        return await readFile(TARGET);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw error;
    }
}

async function main(): Promise<void> {
    const previous = await snapshotOnDisk();
    const response = await fetch(SPEC_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });

    if (!response.ok) {
        fail(`GET ${SPEC_URL} returned ${response.status} ${response.statusText}`);
    }

    // `arrayBuffer` rather than `text`: the bytes are what gets written, and `text` would strip a leading BOM,
    // so a BOM'd body would parse cleanly here and then land on disk.
    const bytes = Buffer.from(await response.arrayBuffer());
    const spec = summarize(bytes.toString('utf8'));
    const changed = previous === null || !previous.equals(bytes);

    // Skipped when the bytes match, so a no-op refresh leaves the file and its mtime alone.
    if (changed) {
        // git only carries `spec/` because the snapshot is in it, so a bootstrap has nowhere to write.
        await mkdir(SPEC_DIR, { recursive: true });

        // Temp file plus rename, so an interrupted write cannot leave a truncated snapshot behind.
        try {
            await writeFile(TEMP, bytes);
            await rename(TEMP, TARGET);
        } catch (error) {
            await rm(TEMP, { force: true }).catch(() => {});
            throw error;
        }
    }

    // Transitions, because `summarize` only checks that `paths` and `components.schemas` are non-empty and the
    // snapshot is `linguist-generated` -- these counts are the only signal that a refresh dropped endpoints.
    const before = previous === null ? null : summarizeOnDisk(previous);
    const missing = previous === null ? '<no snapshot>' : '<unreadable>';

    const paths = `${before?.pathCount ?? missing} -> ${spec.pathCount}`;
    const schemas = `${before?.schemaCount ?? missing} -> ${spec.schemaCount}`;

    console.log(`spec:fetch: openapi ${spec.openapi}, paths ${paths}, schemas ${schemas}`);
    console.log(`spec:fetch: info.version ${before?.version ?? missing} -> ${spec.version}`);
    console.log(`spec:fetch: spec/openapi.json ${changed ? 'updated' : 'unchanged'}, ${bytes.length} bytes`);
}

try {
    await main();
} catch (error) {
    console.error(`spec:fetch: ${report(error)}`);
    // `process.exitCode` rather than `process.exit`, which can exit before a piped stderr has drained.
    process.exitCode = 1;
}
