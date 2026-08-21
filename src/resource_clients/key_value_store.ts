import type { Readable } from 'node:stream';

import type { JsonValue } from 'type-fest';
import { z } from 'zod';

import type { STORAGE_GENERAL_ACCESS } from '@apify/consts';
import log from '@apify/log';
import { createHmacSignatureAsync, createStorageContentSignatureAsync } from '@apify/utilities';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import {
    DEFAULT_TIMEOUT_MILLIS,
    MEDIUM_TIMEOUT_MILLIS,
    ResourceClient,
    SMALL_TIMEOUT_MILLIS,
} from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import type { KeyValueClientListKeysResult, KeyValueListItem, KeyValueStore } from '../models';
import {
    anyObjectSchema,
    applyQueryParamsToUrl,
    cast,
    catchNotFoundOrThrow,
    isBuffer,
    isNode,
    isStream,
    parseArgument,
    parseDateFields,
    pluckData,
} from '../utils';

const listKeysOptionsSchema = z.strictObject({
    limit: z.number().min(0).optional(),
    exclusiveStartKey: z.string().optional(),
    collection: z.string().optional(),
    prefix: z.string().optional(),
    signature: z.string().optional(),
});
const nonEmptyKeySchema = z.string().min(1);
// `signature` is left out - this method produces one. The options type omits it to match.
const createKeysPublicUrlOptionsSchema = z.strictObject({
    limit: z.number().min(0).optional(),
    exclusiveStartKey: z.string().optional(),
    collection: z.string().optional(),
    prefix: z.string().optional(),
    expiresInSecs: z.number().optional(),
});
const keySchema = z.string();
const getRecordOptionsSchema = z.strictObject({
    buffer: z.boolean().optional(),
    stream: z.boolean().optional(),
    disableRedirect: z.boolean().optional(),
    signature: z.string().optional(),
});
const recordSchema = z.strictObject({
    key: z.string(),
    // Values are arbitrary, and a `z.object()` arm would walk every key of a large buffer.
    // Symbols, bigints, functions and non-finite numbers are rejected because they cannot be serialized
    // to JSON - symbols and bigints throw, functions stringify to `undefined` (an empty request body),
    // and `NaN` / `Infinity` would silently become `null`.
    value: z.custom<JsonValue>(
        (value) =>
            value !== undefined &&
            typeof value !== 'symbol' &&
            typeof value !== 'bigint' &&
            typeof value !== 'function' &&
            (typeof value !== 'number' || Number.isFinite(value)),
        'Expected a defined, JSON-serializable value',
    ),
    contentType: z.string().min(1).optional(),
});
const recordOptionsSchema = z.strictObject({
    timeoutSecs: z.number().optional(),
    doNotRetryTimeouts: z.boolean().optional(),
});

export type { KeyValueClientListKeysResult, KeyValueListItem, KeyValueStore, KeyValueStoreStats } from '../models';

/**
 * Client for managing a specific key-value store.
 *
 * Key-value stores are used to store arbitrary data records or files. Each record is identified by
 * a unique key and can contain any type of data. This client provides methods to get, set, and delete
 * records, list keys, and manage the store.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const storeClient = client.keyValueStore('my-store-id');
 *
 * // Set a record
 * await storeClient.setRecord({
 *   key: 'OUTPUT',
 *   value: { foo: 'bar' },
 *   contentType: 'application/json'
 * });
 *
 * // Get a record
 * const record = await storeClient.getRecord('OUTPUT');
 *
 * // List all keys
 * const { items } = await storeClient.listKeys();
 * ```
 *
 * @see https://docs.apify.com/platform/storage/key-value-store
 */
export class KeyValueStoreClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'key-value-stores',
            ...options,
        });
    }

    /**
     * Gets the key-value store object from the Apify API.
     *
     * @returns The KeyValueStore object, or `undefined` if it does not exist
     * @see https://docs.apify.com/api/v2/key-value-store-get
     */
    async get(): Promise<KeyValueStore | undefined> {
        return this._get({}, SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Updates the key-value store with specified fields.
     *
     * @param newFields - Fields to update in the key-value store
     * @param newFields.name - New name for the store
     * @param newFields.title - New title for the store
     * @param newFields.generalAccess - General resource access level ('FOLLOW_USER_SETTING', 'ANYONE_WITH_ID_CAN_READ' or 'RESTRICTED')
     * @returns The updated KeyValueStore object
     * @see https://docs.apify.com/api/v2/key-value-store-put
     */
    async update(newFields: KeyValueClientUpdateOptions): Promise<KeyValueStore> {
        parseArgument(newFields, anyObjectSchema);

        return this._update(newFields, DEFAULT_TIMEOUT_MILLIS);
    }

    /**
     * Deletes the key-value store.
     *
     * @see https://docs.apify.com/api/v2/key-value-store-delete
     */
    async delete(): Promise<void> {
        return this._delete(SMALL_TIMEOUT_MILLIS);
    }

    /**
     * Lists all keys in the key-value store.
     *
     * Returns a paginated list of all record keys in the store. Use pagination parameters
     * to retrieve large lists efficiently.
     *
     * @param options - Listing options
     * @param options.limit - Maximum number of keys to return. Default is 1000.
     * @param options.exclusiveStartKey - Key to start listing from (for pagination). The listing starts with the next key after this one.
     * @param options.collection - Filter keys by collection name.
     * @param options.prefix - Filter keys that start with this prefix.
     * @returns Object containing `items` array of key metadata, pagination info (`count`, `limit`, `isTruncated`, `nextExclusiveStartKey`)
     * @see https://docs.apify.com/api/v2/key-value-store-keys-get
     *
     * @example
     * ```javascript
     * // List all keys
     * const { items, isTruncated } = await client.keyValueStore('my-store').listKeys();
     * items.forEach(item => console.log(`${item.key}: ${item.size} bytes`));
     *
     * // List keys with prefix
     * const { items } = await client.keyValueStore('my-store').listKeys({ prefix: 'user-' });
     *
     * // Paginate through all keys
     * let exclusiveStartKey;
     * do {
     *   const result = await client.keyValueStore('my-store').listKeys({
     *     limit: 100,
     *     exclusiveStartKey
     *   });
     *   // Process result.items...
     *   exclusiveStartKey = result.nextExclusiveStartKey;
     * } while (result.isTruncated);
     * ```
     */
    listKeys(
        options: KeyValueClientListKeysOptions = {},
    ): Promise<KeyValueClientListKeysResult> & AsyncIterable<KeyValueListItem> {
        const parsed = parseArgument(options, listKeysOptionsSchema, 'KeyValueClientListKeysOptions');

        const getPaginatedList = async (
            kvsListOptions: KeyValueClientListKeysOptions = {},
        ): Promise<KeyValueClientListKeysResult> => {
            const response = await this.httpClient.call({
                url: this._url('keys'),
                method: 'GET',
                params: this._params(kvsListOptions),
                timeout: MEDIUM_TIMEOUT_MILLIS,
            });

            return cast(parseDateFields(pluckData(response.data)));
        };

        const paginatedListPromise = getPaginatedList(parsed);
        async function* asyncGenerator() {
            let currentPage = await paginatedListPromise;
            yield* currentPage.items;

            let remainingItems = parsed.limit ? parsed.limit - currentPage.items.length : undefined;

            while (
                currentPage.items.length > 0 && // Continue only if at least some items were returned in the last page.
                // Continue only if there is some next key. The API answers with `null` on the last page and
                // omits the field entirely for a listing that was not truncated.
                currentPage.nextExclusiveStartKey != null &&
                (remainingItems === undefined || remainingItems > 0) // Continue only if the limit was not exceeded.
            ) {
                const newOptions = {
                    ...parsed,
                    limit: remainingItems,
                    exclusiveStartKey: currentPage.nextExclusiveStartKey,
                };
                currentPage = await getPaginatedList(newOptions);
                yield* currentPage.items;
                if (remainingItems) {
                    remainingItems -= currentPage.items.length;
                }
            }
        }

        return Object.defineProperty(paginatedListPromise, Symbol.asyncIterator, {
            value: asyncGenerator,
        }) as unknown as AsyncIterable<KeyValueListItem> & Promise<KeyValueClientListKeysResult>;
    }

    /**
     * Generates a public URL for accessing a specific record in the key-value store.
     *
     * If the client has permission to access the key-value store's URL signing key,
     * the URL will include a cryptographic signature for authenticated access without
     * requiring an API token.
     *
     * @param key - The record key
     * @returns A public URL string for accessing the record
     *
     * @example
     * ```javascript
     * const url = await client.keyValueStore('my-store').getRecordPublicUrl('OUTPUT');
     * console.log(`Public URL: ${url}`);
     * // You can now share this URL or use it in a browser
     * ```
     * @since Added in 2.14.0
     */
    async getRecordPublicUrl(key: string): Promise<string> {
        parseArgument(key, nonEmptyKeySchema);

        const store = await this.get();

        const recordPublicUrl = new URL(this._publicUrl(`records/${key}`));

        if (store?.urlSigningSecretKey) {
            const signature = await createHmacSignatureAsync(store.urlSigningSecretKey, key);
            recordPublicUrl.searchParams.append('signature', signature);
        }

        return recordPublicUrl.toString();
    }

    /**
     * Generates a public URL for accessing the list of keys in the key-value store.
     *
     * If the client has permission to access the key-value store's URL signing key,
     * the URL will include a cryptographic signature which allows access without authentication.
     *
     * @param options - URL generation options (extends all options from {@link listKeys})
     * @param options.expiresInSecs - Number of seconds until the signed URL expires. If omitted, the URL never expires.
     * @param options.limit - Maximum number of keys to return.
     * @param options.prefix - Filter keys by prefix.
     * @returns A public URL string for accessing the keys list
     *
     * @example
     * ```javascript
     * // Create a URL that expires in 1 hour
     * const url = await client.keyValueStore('my-store').createKeysPublicUrl({
     *   expiresInSecs: 3600,
     *   prefix: 'image-'
     * });
     * console.log(`Share this URL: ${url}`);
     * ```
     * @since Added in 2.13.0
     */
    async createKeysPublicUrl(options: KeyValueClientCreateKeysUrlOptions = {}) {
        const parsed = parseArgument(options, createKeysPublicUrlOptionsSchema, 'KeyValueClientCreateKeysUrlOptions');

        const store = await this.get();

        const { expiresInSecs, ...queryOptions } = parsed;

        let createdPublicKeysUrl = new URL(this._publicUrl('keys'));

        if (store?.urlSigningSecretKey) {
            const signature = await createStorageContentSignatureAsync({
                resourceId: store.id,
                urlSigningSecretKey: store.urlSigningSecretKey,
                expiresInMillis: expiresInSecs ? expiresInSecs * 1000 : undefined,
            });
            createdPublicKeysUrl.searchParams.set('signature', signature);
        }

        createdPublicKeysUrl = applyQueryParamsToUrl(createdPublicKeysUrl, queryOptions);

        return createdPublicKeysUrl.toString();
    }

    /**
     * Tests whether a record with the given key exists in the key-value store without retrieving its value.
     *
     * This is more efficient than {@link getRecord} when you only need to check for existence.
     *
     * @param key - The record key to check
     * @returns `true` if the record exists, `false` if it does not
     * @see https://docs.apify.com/api/v2/key-value-store-record-get
     *
     * @example
     * ```javascript
     * const exists = await client.keyValueStore('my-store').recordExists('OUTPUT');
     * if (exists) {
     *   console.log('OUTPUT record exists');
     * }
     * ```
     * @since Added in 2.9.0
     */
    async recordExists(key: string): Promise<boolean> {
        const requestOpts: Record<string, unknown> = {
            url: this._url(`records/${key}`),
            method: 'HEAD',
            params: this._params(),
        };

        try {
            await this.httpClient.call(requestOpts);
            return true;
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return false;
    }

    /**
     * You can use the `buffer` option to get the value in a Buffer (Node.js)
     * or ArrayBuffer (browser) format. In Node.js (not in browser) you can also
     * use the `stream` option to get a Readable stream.
     *
     * When the record does not exist, the function resolves to `undefined`. It does
     * NOT resolve to a `KeyValueStore` record with an `undefined` value.
     *
     * @see https://docs.apify.com/api/v2/key-value-store-record-get
     */
    async getRecord(key: string): Promise<KeyValueStoreRecord<JsonValue> | undefined>;

    async getRecord<Options extends KeyValueClientGetRecordOptions = KeyValueClientGetRecordOptions>(
        key: string,
        options: Options,
    ): Promise<KeyValueStoreRecord<ReturnTypeFromOptions<Options>> | undefined>;

    async getRecord(
        key: string,
        options: KeyValueClientGetRecordOptions = {},
    ): Promise<KeyValueStoreRecord<unknown> | undefined> {
        parseArgument(key, keySchema);
        const parsed = parseArgument(options, getRecordOptionsSchema, 'KeyValueClientGetRecordOptions');

        if (parsed.stream && !isNode()) {
            throw new Error('The stream option can only be used in Node.js environment.');
        }

        if ('disableRedirect' in parsed) {
            log.deprecated(
                'The disableRedirect option for getRecord() is deprecated. ' +
                    'It has no effect and will be removed in the following major release.',
            );
        }

        const queryParams: Record<string, string> = { attachment: 'true' };
        if (parsed.signature) queryParams.signature = parsed.signature;

        const requestOpts: Record<string, unknown> = {
            url: this._url(`records/${key}`),
            method: 'GET',
            params: this._params(queryParams),
            timeout: DEFAULT_TIMEOUT_MILLIS,
        };

        if (parsed.buffer) requestOpts.forceBuffer = true;
        if (parsed.stream) requestOpts.responseType = 'stream';

        try {
            const response = await this.httpClient.call(requestOpts);
            return {
                key,
                value: response.data,
                contentType: response.headers['content-type'] as string | undefined,
            };
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * Stores a record in the key-value store.
     *
     * The record value can be any JSON-serializable object, a string, or a Buffer/Stream.
     * The content type is automatically determined based on the value type, but can be
     * overridden using the `contentType` property.
     *
     * **Note about streams:** If the value is a stream object (has `.pipe` and `.on` methods),
     * the upload cannot be retried on failure or follow redirects. For reliable uploads,
     * buffer the entire stream into memory first.
     *
     * @param record - The record to store
     * @param record.key - Record key (unique identifier)
     * @param record.value - Record value (object, string, Buffer, or Stream)
     * @param record.contentType - Optional MIME type. Auto-detected if not provided:
     *                             - Objects: `'application/json; charset=utf-8'`
     *                             - Strings: `'text/plain; charset=utf-8'`
     *                             - Buffers/Streams: `'application/octet-stream'`
     * @param options - Storage options
     * @param options.timeoutSecs - Timeout for the upload in seconds. Default varies by value size.
     * @param options.doNotRetryTimeouts - If `true`, don't retry on timeout errors. Default is `false`.
     * @see https://docs.apify.com/api/v2/key-value-store-record-put
     *
     * @example
     * ```javascript
     * // Store JSON object
     * await client.keyValueStore('my-store').setRecord({
     *   key: 'OUTPUT',
     *   value: { crawledUrls: 100, items: [...] }
     * });
     *
     * // Store text
     * await client.keyValueStore('my-store').setRecord({
     *   key: 'README',
     *   value: 'This is my readme text',
     *   contentType: 'text/plain'
     * });
     *
     * // Store binary data
     * const imageBuffer = await fetchImageBuffer();
     * await client.keyValueStore('my-store').setRecord({
     *   key: 'screenshot.png',
     *   value: imageBuffer,
     *   contentType: 'image/png'
     * });
     * ```
     */
    async setRecord(record: KeyValueStoreRecord<JsonValue>, options: KeyValueStoreRecordOptions = {}): Promise<void> {
        parseArgument(record, recordSchema);
        const parsed = parseArgument(options, recordOptionsSchema, 'KeyValueStoreRecordOptions');

        const { key } = record;
        let { value, contentType } = record;
        const { timeoutSecs, doNotRetryTimeouts } = parsed;

        const isValueStreamOrBuffer = isStream(value) || isBuffer(value);
        // To allow saving Objects to JSON without providing content type
        if (!contentType) {
            if (isValueStreamOrBuffer) contentType = 'application/octet-stream';
            else if (typeof value === 'string') contentType = 'text/plain; charset=utf-8';
            else contentType = 'application/json; charset=utf-8';
        }

        const isContentTypeJson = contentType.startsWith('application/json');
        if (isContentTypeJson && !isValueStreamOrBuffer && typeof value !== 'string') {
            try {
                value = JSON.stringify(value, null, 2);
            } catch (err) {
                const msg = `The record value cannot be stringified to JSON. Please provide other content type.\nCause: ${(err as Error).message}`;
                throw new Error(msg);
            }
        }

        const uploadOpts: ApifyRequestConfig = {
            url: this._url(`records/${key}`),
            method: 'PUT',
            params: this._params(),
            data: value,
            headers: contentType ? { 'content-type': contentType } : undefined,
            doNotRetryTimeouts,
            timeout: timeoutSecs !== undefined ? timeoutSecs * 1000 : DEFAULT_TIMEOUT_MILLIS,
        };

        await this.httpClient.call(uploadOpts);
    }

    /**
     * Deletes a record from the key-value store.
     *
     * @param key - The record key to delete
     * @see https://docs.apify.com/api/v2/key-value-store-record-delete
     *
     * @example
     * ```javascript
     * await client.keyValueStore('my-store').deleteRecord('temp-data');
     * ```
     */
    async deleteRecord(key: string): Promise<void> {
        parseArgument(key, keySchema);

        await this.httpClient.call({
            url: this._url(`records/${key}`),
            method: 'DELETE',
            params: this._params(),
            timeout: SMALL_TIMEOUT_MILLIS,
        });
    }
}

/**
 * Options for updating a Key-Value Store.
 */
export interface KeyValueClientUpdateOptions {
    name?: string | null;
    /**
     * @since Added in 2.6.1
     */
    title?: string;
    /**
     * @since Added in 2.12.2
     */
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

/**
 * Options for listing keys in a Key-Value Store.
 */
export interface KeyValueClientListKeysOptions {
    limit?: number;
    exclusiveStartKey?: string;
    collection?: string;
    /**
     * @since Added in 2.12.5
     */
    prefix?: string;
    /**
     * @since Added in 2.13.0
     */
    signature?: string;
}

/**
 * Options for creating a public URL to list keys in a Key-Value Store.
 *
 * Extends {@link KeyValueClientListKeysOptions} with URL expiration control, minus `signature` (this
 * method produces one).
 * @since Added in 2.16.0
 */
export interface KeyValueClientCreateKeysUrlOptions extends Omit<KeyValueClientListKeysOptions, 'signature'> {
    expiresInSecs?: number;
}

/**
 * Options for retrieving a record from a Key-Value Store.
 */
export interface KeyValueClientGetRecordOptions {
    buffer?: boolean;
    stream?: boolean;
    /**
     * @since Added in 2.18.0
     */
    signature?: string;
}

/**
 * Represents a record (key-value pair) in a Key-Value Store.
 *
 * @template T - The type of the record's value
 */
export interface KeyValueStoreRecord<T> {
    key: string;
    value: T;
    contentType?: string;
}

/**
 * Options for storing a record in a Key-Value Store.
 * @since Added in 2.12.4
 */
export interface KeyValueStoreRecordOptions {
    timeoutSecs?: number;
    doNotRetryTimeouts?: boolean;
}

/**
 * Helper type to determine the return type based on getRecord options.
 *
 * Returns Readable if stream option is true, Buffer if buffer option is true,
 * otherwise returns JsonValue.
 * @since Added in 2.0.6
 */
export type ReturnTypeFromOptions<Options extends KeyValueClientGetRecordOptions> = Options['stream'] extends true
    ? Readable
    : Options['buffer'] extends true
      ? Buffer
      : JsonValue;
