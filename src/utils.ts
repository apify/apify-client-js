import type { Readable } from 'node:stream';

import type { JsonValue, TypedArray } from 'type-fest';
import { z } from 'zod';

import type { ApifyApiError } from './apify_api_error.js';
import { NotFoundError } from './apify_api_error.js';
import { parseArgument } from '@apify/validations';
import type { ApifyResponse } from './http_client.js';
import type { CompressedValue } from './runtime/types.js';
import { runtime } from '#runtime';
import { ResponseValidationError } from './response_validation_error.js';
import type {
    RequestQueueClientListRequestsOptions,
    RequestQueueClientListRequestsResult,
} from './resource_clients/request_queue.js';
import type { WebhookUpdateData } from './resource_clients/webhook.js';

// @ts-ignore if we enable `resolveJsonModule`, we end up with a `src` folder in `dist`
import packageJson from '../package.json' with { type: 'json' };

const MIN_COMPRESS_BYTES = 1024;
const textEncoder = new TextEncoder();

export { parseArgument };

/**
 * Accepts any non-null, non-array object as a predicate for `z.custom()`.
 * @internal
 */
export function isNonArrayObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Matches any plain object, letting unknown keys through - for payloads whose shape the API
 * validates itself. A `z.custom()` predicate rather than an object schema, so parsing returns
 * the value itself instead of a copy.
 * @internal
 */
export const anyObjectSchema = z.custom<Record<string, unknown>>(isNonArrayObject, {
    error: 'Invalid input: expected an object',
});

/**
 * Generic interface for objects that may contain a data property.
 *
 * @template R - The type of the data property
 */
export interface MaybeData<R> {
    data?: R;
}

// Zod installs its English locale as a module-level side effect but ships `"sideEffects": false`, so
// any tree-shaking bundler drops it and every message degrades to a bare "Invalid input". Passing it
// in per parse keeps them intact without reaching into the zod config the whole process shares.
const { localeError } = z.locales.en();

/**
 * Turns a JSON API response into the value a resource method returns: unwraps the `data` envelope, converts the
 * date fields and validates the result against `schema`, one of the schemas generated from the OpenAPI
 * specification. The validated copy is what callers get, so it is the schema's output -- unknown fields and unknown
 * enum values included, since the schemas let both through, and URL fields normalized, since `z.url()` hands back
 * the parsed URL's serialization.
 *
 * Throws {@link ResponseValidationError} when the response does not match the specification.
 * @internal
 */
export function parseResponse<R>(
    response: ApifyResponse,
    schema: z.ZodType,
    shouldParseField: ((key: string) => boolean) | null = null,
): R {
    const data = parseDateFields(pluckData(response.data), shouldParseField);
    const result = schema.safeParse(data, { error: localeError });
    if (!result.success) {
        const { method = 'GET', url = '' } = response.config;
        throw new ResponseValidationError(result.error, data, { method, url });
    }
    return result.data as R;
}

/**
 * Returns object's 'data' property or throws if parameter is not an object,
 * or an object without a 'data' property.
 */
export function pluckData<R>(obj: MaybeData<R>): R {
    if (typeof obj === 'object' && obj) {
        if (typeof obj.data !== 'undefined') return obj.data;
    }

    throw new Error(`Expected response object with a "data" property, but received: ${obj}`);
}

/**
 * Swallows a 404 Not Found API error and rethrows anything else.
 */
export function catchNotFoundOrThrow(err: ApifyApiError): void {
    if (!(err instanceof NotFoundError)) throw err;
}

/**
 * Like `catchNotFoundOrThrow()`, but swallows the 404 only when the client names its resource by ID.
 *
 * A chained client without an ID, such as `run.dataset()` or `run.log()`, requests a path where a 404 can mean either
 * the parent or the default sub-resource is missing. The response cannot tell the two apart, so the error propagates.
 * @internal
 */
export function catchNotFoundForResourceOrThrow(err: ApifyApiError, resourceId: string | undefined): void {
    if (!resourceId) throw err;
    catchNotFoundOrThrow(err);
}

type ReturnJsonValue = string | number | boolean | null | Date | ReturnJsonObject | ReturnJsonArray;
type ReturnJsonObject = { [Key in string]?: ReturnJsonValue };
type ReturnJsonArray = ReturnJsonValue[];

/**
 * Traverses JSON structure and converts fields that end with "At" to a Date object (fields such as "modifiedAt" or
 * "createdAt").
 *
 * If you want parse other fields as well, you can provide a custom matcher function shouldParseField(). This
 * admittedly awkward approach allows this function to be reused for various purposes without introducing potential
 * breaking changes.
 *
 * If the field cannot be converted to Date, it is left as is.
 */
export function parseDateFields(
    input: JsonValue,
    shouldParseField: ((key: string) => boolean) | null = null,
    depth = 0,
): ReturnJsonValue {
    // Don't go too deep to avoid stack overflows (especially if there is a circular reference). The depth of 4
    // corresponds to obj.items.[x].someArrayField.[y].field, which is what a list response looks like: it
    // nests one level deeper than the single resource it wraps, because both the item array and the nested
    // array spend a level.
    //
    // In a list response it also reaches one level into caller-owned blobs the API stores verbatim, so a
    // listed request's `userData.foo.somethingAt` comes back as a `Date` rather than the string it was
    // written as.
    // TODO: Consider removing this limitation. It might came across as an annoying surprise as it's not communicated.
    if (depth > 4) {
        return input as ReturnJsonValue;
    }

    if (Array.isArray(input)) return input.map((child) => parseDateFields(child, shouldParseField, depth + 1));
    if (!input || typeof input !== 'object') return input;

    return Object.entries(input).reduce((output, [k, v]) => {
        const isValObject = !!v && typeof v === 'object';
        if (k.endsWith('At') || (shouldParseField && shouldParseField(k))) {
            if (v) {
                const d = new Date(v as string);
                output[k] = Number.isNaN(d.getTime()) ? (v as string) : d;
            } else {
                output[k] = v;
            }
        } else if (isValObject || Array.isArray(v)) {
            output[k] = parseDateFields(v!, shouldParseField, depth + 1);
        } else {
            output[k] = v;
        }
        return output;
    }, {} as ReturnJsonObject);
}

/**
 * Helper function that converts array of webhooks to base64 string
 */
export function stringifyWebhooksToBase64(webhooks?: readonly WebhookUpdateData[]): string | undefined {
    if (!webhooks) return;
    return bytesToBase64(textEncoder.encode(JSON.stringify(webhooks)));
}

/**
 * Encodes bytes as base64. `btoa()` takes a binary string, and the bytes are turned into one in slices,
 * because spreading them all into a single `String.fromCharCode()` call overflows the argument limit on
 * inputs of a few tens of kilobytes.
 */
export function bytesToBase64(bytes: Uint8Array): string {
    const SLICE_LENGTH = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += SLICE_LENGTH) {
        binary += String.fromCharCode(...bytes.subarray(i, i + SLICE_LENGTH));
    }
    return btoa(binary);
}

/**
 * Concatenates byte chunks into one array.
 */
export function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const result = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

/**
 * Views a request body as bytes: a string is UTF-8 encoded, binary values are viewed in place. Anything else
 * - a stream, a `Blob`, form data - is `undefined`.
 */
function toBytes(value: unknown): Uint8Array | undefined {
    if (typeof value === 'string') return textEncoder.encode(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    return undefined;
}

/**
 * Compresses the passed value with the runtime's best available algorithm. Returns `undefined` if the data
 * is too small, is not a string or binary value, or if the runtime does not offer compression.
 */
export async function maybeCompressValue(value: unknown): Promise<CompressedValue | undefined> {
    // Request compression is not that important so let's
    // skip it instead of throwing for unsupported types.
    const bytes = toBytes(value);
    if (!bytes || bytes.byteLength < MIN_COMPRESS_BYTES) return undefined;

    return runtime.compress(bytes);
}

/**
 * Reads an environment variable, on runtimes that have them.
 */
export function getEnv(name: string): string | undefined {
    return typeof process !== 'undefined' ? process.env?.[name] : undefined;
}

/**
 * Helper function slice the items from array to fit the max byte length.
 */
export function sliceArrayByByteLength<T>(array: T[], maxByteLength: number, startIndex: number): T[] {
    const stringByteLength = (str: string) => textEncoder.encode(str).byteLength;
    const arrayByteLength = stringByteLength(JSON.stringify(array));
    if (arrayByteLength < maxByteLength) return array;

    const slicedArray: T[] = [];
    let byteLength = 2; // 2 bytes for the empty array []
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const itemByteSize = stringByteLength(JSON.stringify(item));
        if (itemByteSize > maxByteLength) {
            throw new Error(
                `RequestQueueClient.batchAddRequests: The size of the request with index: ${startIndex + i} ` +
                    `exceeds the maximum allowed size (${maxByteLength} bytes).`,
            );
        }
        if (byteLength + itemByteSize >= maxByteLength) break;
        byteLength += itemByteSize;
        slicedArray.push(item);
    }

    return slicedArray;
}

export function isBuffer(value: unknown): value is Buffer | ArrayBuffer | TypedArray {
    // Tag checks rather than `instanceof`, to also match buffers from another realm. `isView()`
    // additionally covers `DataView`, which is not raw binary content.
    if (ArrayBuffer.isView(value)) return !isTagged(value, 'DataView');
    return isTagged(value, 'ArrayBuffer');
}

function isTagged(value: unknown, tag: string): boolean {
    return Object.prototype.toString.call(value) === `[object ${tag}]`;
}

export function isStream(value: unknown): value is Readable {
    if (value === null || typeof value !== 'object') return false;
    const { on, pipe } = value as Partial<Readable>;
    return typeof on === 'function' && typeof pipe === 'function';
}

export function getVersionData(): { version: string } {
    // Only the version, so a bundler can drop the rest of the manifest.
    return { version: packageJson.version };
}

/**
 * Helper class to create async iterators from paginated list endpoints.
 */
export class RequestQueuePaginationIterator {
    private readonly maxPageLimit: number;

    private readonly getPage: (
        opts: RequestQueueClientListRequestsOptions,
    ) => Promise<RequestQueueClientListRequestsResult>;

    private readonly limit?: number;

    private readonly cursor?: string;

    constructor(options: RequestQueuePaginationIteratorOptions) {
        this.maxPageLimit = options.maxPageLimit;
        this.limit = options.limit;
        this.cursor = options.cursor;
        this.getPage = options.getPage;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<RequestQueueClientListRequestsResult> {
        let nextCursor = this.cursor;
        let iterateItemCount = 0;
        while (true) {
            const pageLimit = this.limit
                ? Math.min(this.maxPageLimit, this.limit - iterateItemCount)
                : this.maxPageLimit;

            const page: RequestQueueClientListRequestsResult = await this.getPage({
                limit: pageLimit,
                cursor: nextCursor,
            });
            // There are no more pages to iterate
            if (page.items.length === 0) return;
            yield page;
            iterateItemCount += page.items.length;
            // Limit reached stopping to iterate
            if ((this.limit && iterateItemCount >= this.limit) || !page.nextCursor) return;

            nextCursor = page.nextCursor;
        }
    }
}

/**
 * Options for creating a pagination iterator.
 */
export interface RequestQueuePaginationIteratorOptions {
    maxPageLimit: number;
    getPage: (opts: RequestQueueClientListRequestsOptions) => Promise<RequestQueueClientListRequestsResult>;
    limit?: number;
    cursor?: string;
}

/**
 * Standard pagination options for API requests.
 */
export interface PaginationOptions {
    /** Position of the first returned entry. */
    offset?: number;
    /** Maximum number of entries requested. */
    limit?: number;
    /** Maximum number of items returned in one API response. Relevant in the context of asyncIterator, the iterator
     * will fetch results in chunks of this size from API and yield them one by one. It will stop fetching once the
     * limit is reached or once all items from API have been fetched.
     *
     * Chunk size is usually limited by API. Minimum of those two limits will be used.
     * @since Added in 2.21.0
     * */
    chunkSize?: number;
}

/**
 * Schema shape of {@link PaginationOptions}, to spread into every paginating client's list schema. One
 * copy stops it drifting from the interface.
 * @internal
 */
export const paginationOptionsShape = {
    limit: z.number().min(0).optional(),
    offset: z.number().min(0).optional(),
    chunkSize: z.number().positive().optional(),
};

/**
 * Standard paginated response format.
 *
 * @template Data - The type of items in the response
 */
export interface PaginatedResponse<Data> {
    /** Total count of entries. */
    total: number;
    /** Entries. */
    items: Data[];
}

/**
 * Paginated list with detailed pagination information.
 *
 * Used primarily for Dataset items and other list operations that support
 * offset-based pagination and field transformations.
 *
 * @template Data - The type of items in the list
 */
export interface PaginatedList<Data> extends PaginatedResponse<Data> {
    /** Count of dataset entries returned in this set. */
    count: number;
    /** Position of the first returned entry in the dataset. */
    offset: number;
    /** Maximum number of dataset entries requested. */
    limit: number;
    /** Should the results be in descending order. */
    desc: boolean;
}

/**
 * Type representing both a Promise of a paginated list and an async iterable.
 *
 * Allows both awaiting the first page and iterating through all pages.
 *
 * @template T - The type of items in the paginated list
 */
export type PaginatedIterator<T> = Promise<PaginatedList<T>> & AsyncIterable<T>;

export function cast<T>(input: unknown): T {
    return input as T;
}

export function asArray<T>(value: T | T[]): T[] {
    if (Array.isArray(value)) {
        return value;
    }

    return [value];
}

/**
 * Generic dictionary type (key-value map).
 *
 * @template T - The type of values in the dictionary
 * @since Added in 2.0.4
 */
export type Dictionary<T = unknown> = Record<PropertyKey, T>;

/**
 * Utility type that makes specific keys optional while preserving union types.
 *
 * @template T - The base type
 * @template K - Keys to make optional
 */
export type DistributiveOptional<T, K extends keyof T> = T extends any ? Omit<T, K> & Partial<Pick<T, K>> : never;

/**
 * Adds query parameters to a given URL based on the provided options object.
 */
export function applyQueryParamsToUrl(
    url: URL,
    options?: Record<string, string | number | boolean | string[] | undefined>,
) {
    for (const [key, value] of Object.entries(options ?? {})) {
        // skip undefined values
        if (value === undefined) continue;
        // join array values with a comma
        if (Array.isArray(value)) {
            url.searchParams.set(key, value.join(','));
            continue;
        }
        url.searchParams.set(key, String(value));
    }
    return url;
}

const pathSegmentSchema = z
    .string()
    .nonempty()
    .refine((v) => v !== '.' && v !== '..', { error: 'URL path must not contain dot segments' });

/**
 * Percent-encodes a caller-supplied URL path segment so it cannot restructure the request path.
 *
 * Empty strings and dot segments are rejected instead of encoded, because URL parsers resolve
 * dot segments after decoding - `records/%2E%2E` collapses to the parent endpoint just like `records/..`.
 */
export function toPathSegment(value: string): string {
    const valueParsed = parseArgument(value, pathSegmentSchema);
    return encodeURIComponent(valueParsed);
}

/**
 * Builds a URL path from segments. A plain string is used as-is, so literal paths such as
 * `requests/batch` keep their separators; an array has each of its segments encoded individually.
 */
export function toPath(path: string | string[]): string {
    return Array.isArray(path) ? path.map(toPathSegment).join('/') : path;
}
