import type { Readable } from 'node:stream';

import ow from 'ow';
import type { JsonValue, TypedArray } from 'type-fest';

import type { ApifyApiError } from './apify_api_error';
import type {
    RequestQueueClientListRequestsOptions,
    RequestQueueClientListRequestsResult,
} from './resource_clients/request_queue';
import type { WebhookUpdateData } from './resource_clients/webhook';

const NOT_FOUND_STATUS_CODE = 404;
const RECORD_NOT_FOUND_TYPE = 'record-not-found';
const RECORD_OR_TOKEN_NOT_FOUND_TYPE = 'record-or-token-not-found';
const MIN_GZIP_BYTES = 1024;

/**
 * Generic interface for objects that may contain a data property.
 *
 * @template R - The type of the data property
 */
export interface MaybeData<R> {
    data?: R;
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
 * If given HTTP error has NOT_FOUND_STATUS_CODE status code then returns undefined.
 * Otherwise rethrows error.
 */
export function catchNotFoundOrThrow(err: ApifyApiError): void {
    const isNotFoundStatus = err.statusCode === NOT_FOUND_STATUS_CODE;
    const isNotFoundMessage =
        err.type === RECORD_NOT_FOUND_TYPE || err.type === RECORD_OR_TOKEN_NOT_FOUND_TYPE || err.httpMethod === 'head';
    const isNotFoundError = isNotFoundStatus && isNotFoundMessage;
    if (!isNotFoundError) throw err;
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
    // Don't go too deep to avoid stack overflows (especially if there is a circular reference). The depth of 3
    // corresponds to obj.data.someArrayField.[x].field and should be generally enough.
    // TODO: Consider removing this limitation. It might came across as an annoying surprise as it's not communicated.
    if (depth > 3) {
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
export function stringifyWebhooksToBase64(webhooks: WebhookUpdateData[]): string | undefined {
    if (!webhooks) return;
    const webhooksJson = JSON.stringify(webhooks);
    if (isNode()) {
        return Buffer.from(webhooksJson, 'utf8').toString('base64');
    }
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(webhooksJson);
    return btoa(String.fromCharCode(...uint8Array));
}

let gzipPromisified: ((arg: string | Buffer<ArrayBufferLike>) => Promise<Buffer>) | undefined;

/**
 * Gzip provided value, otherwise returns undefined.
 */
export async function maybeGzipValue(value: unknown): Promise<Buffer | undefined> {
    if (!isNode()) return;
    if (typeof value !== 'string' && !Buffer.isBuffer(value)) return;

    // Request compression is not that important so let's
    // skip it instead of throwing for unsupported types.
    const areDataLargeEnough = Buffer.byteLength(value as string) >= MIN_GZIP_BYTES;
    if (areDataLargeEnough) {
        if (!gzipPromisified) {
            const { promisify } = await dynamicNodeImport<typeof import('node:util')>('node:util');
            const { gzip } = await dynamicNodeImport<typeof import('node:zlib')>('node:zlib');
            gzipPromisified = promisify(gzip);
        }

        return gzipPromisified(value);
    }

    return undefined;
}

/**
 * Helper function slice the items from array to fit the max byte length.
 */
export function sliceArrayByByteLength<T>(array: T[], maxByteLength: number, startIndex: number): T[] {
    const stringByteLength = (str: string) => (isNode() ? Buffer.byteLength(str) : new Blob([str]).size);
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

export function isNode(): boolean {
    return !!(typeof process !== 'undefined' && process.versions && process.versions.node);
}

/**
 * Dynamic import wrapper that prevents bundlers from statically analyzing the import specifier.
 * Use this for Node.js-only modules that should not be included in browser bundles.
 */
export async function dynamicNodeImport<T = any>(specifier: string): Promise<T> {
    return await import(specifier)
}

export function isBuffer(value: unknown): value is Buffer | ArrayBuffer | TypedArray {
    return ow.isValid(value, ow.any(ow.buffer, ow.arrayBuffer, ow.typedArray));
}

export function isStream(value: unknown): value is Readable {
    return ow.isValid(value, ow.object.hasKeys('on', 'pipe'));
}

export function getVersionData(): { version: string } {
    if (typeof BROWSER_BUILD !== 'undefined') {
        return { version: VERSION! };
    }

    // eslint-disable-next-line
    return require('../package.json');
}

/**
 * Helper class to create async iterators from paginated list endpoints with exclusive start key.
 */
export class PaginationIterator {
    private readonly maxPageLimit: number;

    private readonly getPage: (
        opts: RequestQueueClientListRequestsOptions,
    ) => Promise<RequestQueueClientListRequestsResult>;

    private readonly limit?: number;

    private readonly exclusiveStartId?: string;

    constructor(options: PaginationIteratorOptions) {
        this.maxPageLimit = options.maxPageLimit;
        this.limit = options.limit;
        this.exclusiveStartId = options.exclusiveStartId;
        this.getPage = options.getPage;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<RequestQueueClientListRequestsResult> {
        let nextPageExclusiveStartId;
        let iterateItemCount = 0;
        while (true) {
            const pageLimit = this.limit
                ? Math.min(this.maxPageLimit, this.limit - iterateItemCount)
                : this.maxPageLimit;
            const pageExclusiveStartId = nextPageExclusiveStartId || this.exclusiveStartId;
            const page: RequestQueueClientListRequestsResult = await this.getPage({
                limit: pageLimit,
                exclusiveStartId: pageExclusiveStartId,
            });
            // There are no more pages to iterate
            if (page.items.length === 0) return;
            yield page;
            iterateItemCount += page.items.length;
            // Limit reached stopping to iterate
            if (this.limit && iterateItemCount >= this.limit) return;
            nextPageExclusiveStartId = page.items[page.items.length - 1].id;
        }
    }
}

declare global {
    export const BROWSER_BUILD: boolean | undefined;
    export const VERSION: string | undefined;
}

/**
 * Options for creating a pagination iterator.
 */
export interface PaginationIteratorOptions {
    maxPageLimit: number;
    getPage: (opts: RequestQueueClientListRequestsOptions) => Promise<RequestQueueClientListRequestsResult>;
    limit?: number;
    exclusiveStartId?: string;
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
     * */
    chunkSize?: number;
}

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
