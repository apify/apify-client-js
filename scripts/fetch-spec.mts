/**
 * Refresh the vendored Apify API OpenAPI snapshot at `spec/openapi.json`.
 *
 * Run with `pnpm spec:fetch`. Maintainer-facing and dev-only: the snapshot is committed, so nothing in the
 * published package or in CI depends on `docs.apify.com` being reachable.
 *
 * Needs a Node that strips types natively, so 22.18+ or 23.6+. That is above the version floor the package
 * itself supports, and an older Node fails here while parsing this file rather than with anything that names
 * a version, hence the note.
 *
 * The snapshot lives outside `src/` on purpose. It is a build input, not source, and `resolveJsonModule` is
 * on, so a stray import from `src/` would otherwise emit the whole 1 MB document into `dist/` and ship it.
 *
 * The response bytes are written through untouched rather than re-serialized. The endpoint already
 * pretty-prints with a 2-space indent and LF, so passing the bytes straight through keeps refreshes free of
 * formatting-only diffs even if upstream ever emits something `JSON.stringify` would render differently.
 */

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';

const SPEC_URL = 'https://docs.apify.com/api/openapi.json';
const SPEC_DIR = new URL('../spec/', import.meta.url);
const TARGET = new URL('openapi.json', SPEC_DIR);
const TEMP = new URL('openapi.json.tmp', SPEC_DIR);

/** Generous for a 1 MB document on a slow link, but bounded, so a stalled connection still reports. */
const TIMEOUT_MS = 30_000;

/** Everything this script reads out of a spec, validated rather than asserted. */
interface SpecSummary {
    openapi: string;
    version: string;
    pathCount: number;
    schemaCount: number;
}

/** Marks a failure this script diagnosed itself, so the top level can report it without a stack trace. */
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

/** The same, for the snapshot already on disk, which nothing has validated and may be hand-edited. */
function versionOnDisk(snapshot: Buffer): string {
    try {
        return versionIn(JSON.parse(snapshot.toString('utf8')));
    } catch {
        return '<unparseable>';
    }
}

/**
 * Reject anything that is not an OpenAPI 3.1 document with content in it, before the snapshot is touched.
 *
 * The snapshot is the input to type generation, so a docs redeploy serving an error page with a 200, a
 * response truncated mid-flight or a spec version bump has to stop the refresh here -- otherwise it lands as
 * a diff that looks like an API change. This checks shape, not substance: a well-formed spec that lost most
 * of its endpoints still passes, so the diff is still worth reading before committing.
 *
 * The summary is built from the narrowed values instead of asserting a type onto the parsed document, so
 * dropping a check below turns into a compile error rather than a crash further down.
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

    // Deliberately narrower than a major-version check. 3.0 and a hypothetical 3.2 both describe schemas
    // differently enough that the generated types would need a look, so both should stop here.
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

function report(error: unknown): string {
    if (error instanceof SpecFetchError) {
        return error.message;
    }

    // Node reports network failures as `TypeError: fetch failed` with the real reason on `cause`. That reason
    // is the whole diagnosis and the stack above it is undici internals, so keep those to one line.
    if (error instanceof Error && error.cause instanceof Error) {
        return `${error.name}: ${error.message}: ${error.cause.message}`;
    }

    // Nothing diagnosed what is left -- a bug in this script, or an errno nothing here anticipated -- so keep
    // the stack, which is the only pointer to where it came from.
    if (error instanceof Error) {
        return error.stack ?? `${error.name}: ${error.message}`;
    }

    return String(error);
}

/** A missing snapshot is a normal state; anything else about reading it is not, so it must not be swallowed. */
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

    // `arrayBuffer` rather than `text`: `text` decodes and re-encodes, which strips a leading BOM and turns a
    // non-UTF-8 body into replacement characters that would still parse as JSON.
    const bytes = Buffer.from(await response.arrayBuffer());
    const spec = summarize(bytes.toString('utf8'));
    const changed = previous === null || !previous.equals(bytes);

    // Skipped when the bytes match, so a no-op refresh leaves the file and its mtime alone.
    if (changed) {
        // git only carries `spec/` because the snapshot is in it, so bootstrapping after the snapshot was
        // deleted has no directory to write into.
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

    // No separate unchanged case: byte-identical input parses to the same `info.version`.
    const oldVersion = previous === null ? '<no snapshot>' : versionOnDisk(previous);

    console.log(`spec:fetch: openapi ${spec.openapi}, ${spec.pathCount} paths, ${spec.schemaCount} schemas`);
    console.log(`spec:fetch: info.version ${oldVersion} -> ${spec.version}`);
    console.log(`spec:fetch: spec/openapi.json ${changed ? 'updated' : 'unchanged'}, ${bytes.length} bytes`);
}

try {
    await main();
} catch (error) {
    console.error(`spec:fetch: ${report(error)}`);
    // `process.exitCode` rather than `process.exit`, which can exit before a piped stderr has drained.
    process.exitCode = 1;
}
