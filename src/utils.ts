import util from 'util';
import zlib from 'zlib';
import ow from 'ow';
import type { TypedArray, JsonValue } from 'type-fest';
import type { Readable } from 'node:stream';
import { ApifyApiError } from './apify_api_error';
import { WebhookUpdateData } from './resource_clients/webhook';
import {
    RequestQueueClientListRequestsOptions,
    RequestQueueClientListRequestsResult,
} from './resource_clients/request_queue';

const PARSE_DATE_FIELDS_MAX_DEPTH = 3; // obj.data.someArrayField.[x].field
const PARSE_DATE_FIELDS_KEY_SUFFIX = 'At';
const NOT_FOUND_STATUS_CODE = 404;
const RECORD_NOT_FOUND_TYPE = 'record-not-found';
const RECORD_OR_TOKEN_NOT_FOUND_TYPE = 'record-or-token-not-found';
const MIN_GZIP_BYTES = 1024;

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
    const isNotFoundMessage = err.type === RECORD_NOT_FOUND_TYPE || err.type === RECORD_OR_TOKEN_NOT_FOUND_TYPE;
    const isNotFoundError = isNotFoundStatus && isNotFoundMessage;
    if (!isNotFoundError) throw err;
}

type ReturnJsonValue = string | number | boolean | null | Date | ReturnJsonObject | ReturnJsonArray;
type ReturnJsonObject = { [Key in string]?: ReturnJsonValue; };
type ReturnJsonArray = Array<ReturnJsonValue>;

/**
 * Helper function that traverses JSON structure and parses fields such as modifiedAt or createdAt to dates.
 */
export function parseDateFields(input: JsonValue, depth = 0): ReturnJsonValue {
    if (depth > PARSE_DATE_FIELDS_MAX_DEPTH) return input as ReturnJsonValue;
    if (Array.isArray(input)) return input.map((child) => parseDateFields(child, depth + 1));
    if (!input || typeof input !== 'object') return input;

    return Object.entries(input).reduce((output, [k, v]) => {
        const isValObject = !!v && typeof v === 'object';
        if (k.endsWith(PARSE_DATE_FIELDS_KEY_SUFFIX)) {
            if (v) {
                const d = new Date(v as string);
                output[k] = Number.isNaN(d.getTime()) ? v as string : d;
            } else {
                output[k] = v;
            }
        } else if (isValObject || Array.isArray(v)) {
            output[k] = parseDateFields(v!, depth + 1);
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

let gzipPromise: ReturnType<typeof util['promisify']>;
if (isNode()) gzipPromise = util.promisify(zlib.gzip);

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
        return gzipPromise(value);
    }

    return undefined;
}

export function isNode(): boolean {
    return !!(typeof process !== 'undefined' && process.versions && process.versions.node);
}

export function isBuffer(value: unknown): value is Buffer | ArrayBuffer | TypedArray {
    return ow.isValid(value, ow.any(ow.buffer, ow.arrayBuffer, ow.typedArray));
}

export function isStream(value: unknown): value is Readable {
    return ow.isValid(value, ow.object.hasKeys('on', 'pipe'));
}

export function getVersionData(): { version: string; } {
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

    private readonly getPage: (opts: RequestQueueClientListRequestsOptions) => Promise<RequestQueueClientListRequestsResult>;

    private readonly limit?: number;

    private readonly exclusiveStartId?: string;

    constructor(options: PaginationIteratorOptions) {
        this.maxPageLimit = options.maxPageLimit;
        this.limit = options.limit;
        this.exclusiveStartId = options.exclusiveStartId;
        this.getPage = options.getPage;
    }

    async* [Symbol.asyncIterator](): AsyncIterator<RequestQueueClientListRequestsResult> {
        let nextPageExclusiveStartId;
        let iterateItemCount = 0;
        while (true) {
            const pageLimit = this.limit ? Math.min(this.maxPageLimit, this.limit - iterateItemCount) : this.maxPageLimit;
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

export interface PaginationIteratorOptions {
    maxPageLimit: number;
    getPage: (opts: RequestQueueClientListRequestsOptions) => Promise<RequestQueueClientListRequestsResult>;
    limit?: number;
    exclusiveStartId?: string;
}

export interface PaginatedList<Data> {
    /** Total count of entries in the dataset. */
    total: number;
    /** Count of dataset entries returned in this set. */
    count: number;
    /** Position of the first returned entry in the dataset. */
    offset: number;
    /** Maximum number of dataset entries requested. */
    limit: number;
    /** Should the results be in descending order. */
    desc: boolean;
    /** Dataset entries based on chosen format parameter. */
    items: Data[];
}

export function cast<T>(input: unknown): T {
    return input as T;
}

export type Dictionary<T = unknown> = Record<PropertyKey, T>;

export type DistributiveOptional<T, K extends keyof T> = T extends any ? Omit<T, K> & Partial<Pick<T, K>> : never;
