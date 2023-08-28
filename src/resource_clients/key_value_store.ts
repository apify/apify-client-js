import log from '@apify/log';
import ow from 'ow';
import { JsonValue } from 'type-fest';
import { ApifyApiError } from '../apify_api_error';
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import { ApifyRequestConfig } from '../http_client';
import {
    cast,
    catchNotFoundOrThrow,
    isBuffer,
    isNode,
    isStream,
    parseDateFields,
    pluckData,
} from '../utils';

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
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/get-store
     */
    async get(): Promise<KeyValueStore | undefined> {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/update-store
     */
    async update(newFields: KeyValueClientUpdateOptions): Promise<KeyValueStore> {
        ow(newFields, ow.object);

        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/store-object/delete-store
     */
    async delete(): Promise<void> {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/key-collection/get-list-of-keys
     */
    async listKeys(options: KeyValueClientListKeysOptions = {}): Promise<KeyValueClientListKeysResult> {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
            exclusiveStartKey: ow.optional.string,
        }));

        const response = await this.httpClient.call({
            url: this._url('keys'),
            method: 'GET',
            params: this._params(options),
        });

        return cast(parseDateFields(pluckData(response.data)));
    }

    /**
     * You can use the `buffer` option to get the value in a Buffer (Node.js)
     * or ArrayBuffer (browser) format. In Node.js (not in browser) you can also
     * use the `stream` option to get a Readable stream.
     *
     * When the record does not exist, the function resolves to `undefined`. It does
     * NOT resolve to a `KeyValueStore` record with an `undefined` value.
     * https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record
     */
    async getRecord(key: string): Promise<KeyValueStoreRecord<JsonValue> | undefined>;

    async getRecord<Options extends KeyValueClientGetRecordOptions = KeyValueClientGetRecordOptions>(
        key: string,
        options: Options
    ): Promise<KeyValueStoreRecord<ReturnTypeFromOptions<Options>> | undefined>;

    async getRecord(key: string, options: KeyValueClientGetRecordOptions = {}): Promise<KeyValueStoreRecord<unknown> | undefined> {
        ow(key, ow.string);
        ow(options, ow.object.exactShape({
            buffer: ow.optional.boolean,
            stream: ow.optional.boolean,
            disableRedirect: ow.optional.boolean,
        }));

        if (options.stream && !isNode()) {
            throw new Error('The stream option can only be used in Node.js environment.');
        }

        if ('disableRedirect' in options) {
            log.deprecated('The disableRedirect option for getRecord() is deprecated. '
                + 'It has no effect and will be removed in the following major release.');
        }

        const requestOpts: Record<string, unknown> = {
            url: this._url(`records/${key}`),
            method: 'GET',
            params: this._params(),
        };

        if (options.buffer) requestOpts.forceBuffer = true;
        if (options.stream) requestOpts.responseType = 'stream';

        try {
            const response = await this.httpClient.call(requestOpts);
            return {
                key,
                value: response.data,
                contentType: response.headers['content-type'],
            };
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * The value in the record can be a stream object (detected by having the `.pipe`
     * and `.on` methods). However, note that in that case following redirects or
     * retrying the request if it fails (for example due to rate limiting) isn't
     * possible. If you want to keep that behavior, you need to collect the whole
     * stream contents into a Buffer and then send the full buffer. See [this
     * StackOverflow answer](https://stackoverflow.com/a/14269536/7292139) for
     * an example how to do that.
     *
     * https://docs.apify.com/api/v2#/reference/key-value-stores/record/put-record
     */
    async setRecord(record: KeyValueStoreRecord<JsonValue>): Promise<void> {
        ow(record, ow.object.exactShape({
            key: ow.string,
            value: ow.any(ow.null, ow.string, ow.number, ow.object, ow.boolean),
            contentType: ow.optional.string.nonEmpty,
        }));

        const { key } = record;
        let { value, contentType } = record;

        const isValueStreamOrBuffer = isStream(value) || isBuffer(value);
        // To allow saving Objects to JSON without providing content type
        if (!contentType) {
            if (isValueStreamOrBuffer) contentType = 'application/octet-stream';
            else if (typeof value === 'string') contentType = 'text/plain; charset=utf-8';
            else contentType = 'application/json; charset=utf-8';
        }

        const isContentTypeJson = /^application\/json/.test(contentType);
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
            headers: contentType && { 'content-type': contentType },
        };

        await this.httpClient.call(uploadOpts);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/key-value-stores/record/delete-record
     */
    async deleteRecord(key: string): Promise<void> {
        ow(key, ow.string);

        await this.httpClient.call({
            url: this._url(`records/${key}`),
            method: 'DELETE',
            params: this._params(),
        });
    }
}

export interface KeyValueStore {
    id: string;
    name?: string;
    title?: string;
    userId: string;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
    actId?: string;
    actRunId?: string;
    stats?: KeyValueStoreStats;
}

export interface KeyValueStoreStats {
    readCount?: number;
    writeCount?: number;
    deleteCount?: number;
    listCount?: number;
    storageBytes?: number;
}

export interface KeyValueClientUpdateOptions {
    name: string;
    title?: string;
}

export interface KeyValueClientListKeysOptions {
    limit?: number;
    exclusiveStartKey?: string;
}

export interface KeyValueClientListKeysResult {
    count: number;
    limit: number;
    exclusiveStartKey: string;
    isTruncated: boolean;
    nextExclusiveStartKey: string;
    items: KeyValueListItem[];
}

export interface KeyValueListItem {
    key: string;
    size: number;
}

export interface KeyValueClientGetRecordOptions {
    buffer?: boolean;
    stream?: boolean;
}

export interface KeyValueStoreRecord<T> {
    key: string;
    value: T;
    contentType?: string;
}

export type ReturnTypeFromOptions<Options extends KeyValueClientGetRecordOptions> = Options['stream'] extends true
    ? ReadableStream
    : Options['buffer'] extends true ? Buffer : JsonValue;
