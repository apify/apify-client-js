import type { Readable } from 'node:stream';

import { z } from 'zod';

import { ApifyClientError } from '../apify_client_error.js';
import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { ApifyResponse, ApifyResponseType, HttpMethod } from '../http_clients/index.js';
import type { HttpCompressor } from '../http_compressors/base.js';
import type { HttpCompressionAlgorithm } from '../http_compressors/resolve.js';
import { compressionSchema, resolveCompressor } from '../http_compressors/resolve.js';
import type { ActorResource } from '../models.js';
import type { TimeoutOptions } from '../timeouts.js';
import * as schemas from '../schemas.js';
import { timeoutOptionsSchema, timeoutOptionsShape } from '../timeouts.js';
import { runtime } from '#runtime';
import { parseArgument, parseResponse } from '../utils.js';
import { BuildClient } from './build.js';
import { BuildCollectionClient } from './build_collection.js';

/**
 * Statuses a server request is retried on. Other statuses may come from the Actor's code, which a retry would run
 * again.
 */
const SERVER_RETRY_STATUS_CODES = [429, 503];

const requestOptionsSchema = z.strictObject({
    method: z
        .enum(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'] satisfies HttpMethod[])
        .optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
    data: z.unknown().optional(),
    compression: compressionSchema.optional(),
    responseType: z.enum(['parsed', 'buffer', 'stream']).optional(),
    ...timeoutOptionsShape,
});

/**
 * Client for the server interface of a specific Actor.
 *
 * Provides methods to work with the web server of a Server Actor, such as sending it requests or getting its OpenAPI
 * specification. Get an instance with {@link ActorClient.server}.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const actorServerClient = client.actor('username/actor-name').server();
 *
 * const response = await actorServerClient.request('/search', { params: { q: 'apify' } });
 * console.log(response.data);
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running/standby
 */
export class ActorServerClient extends ResourceClient {
    #url?: string;

    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'actors',
            ...options,
        });
    }

    /**
     * Returns the URL of the Actor's server.
     *
     * The URL is the Actor's `standbyUrl`, fetched from the API by the first call of this method or
     * {@link getOpenApiSpec} and reused by later calls on this client. Use it to call the server with another HTTP client, for example one generated from the server's OpenAPI
     * specification.
     *
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for the API request. Default is `'short'`.
     * @returns The URL of the Actor's server
     * @throws {ApifyClientError} When the Actor is not a Server Actor.
     * @throws {NotFoundError} When the Actor does not exist.
     * @see https://docs.apify.com/platform/actors/running/standby
     */
    async getUrl(options: TimeoutOptions = {}): Promise<string> {
        const { timeoutSecs = 'short', signal } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        if (this.#url === undefined) {
            const actor = await this.#getServerActor(timeoutSecs, signal);
            this.#url = actor.standbyUrl!;
        }
        return this.#url;
    }

    /**
     * Returns the OpenAPI specification of the Actor's server.
     *
     * The specification is the web server schema from the Actor's definition, taken from the build that serves the
     * server interface: the build set in `actorStandby.build`, or `latest` if none is set. Use it to generate an HTTP
     * client for the server, and point that client at the URL returned by {@link getUrl}.
     *
     * @param options - Request options
     * @param options.timeoutSecs - Timeout for each API request. Default is `'short'`.
     * @returns The OpenAPI specification of the Actor's server, or `undefined` if the Actor's definition doesn't
     * include one
     * @throws {ApifyClientError} When the Actor is not a Server Actor, or the build that serves its server interface
     * doesn't exist.
     * @throws {NotFoundError} When the Actor does not exist.
     * @see https://docs.apify.com/platform/actors/development/actor-definition/web-server-schema
     */
    async getOpenApiSpec(options: TimeoutOptions = {}): Promise<Record<string, unknown> | undefined> {
        const { timeoutSecs = 'short', signal } = parseArgument(options, timeoutOptionsSchema, 'TimeoutOptions');

        const actor = await this.#getServerActor(timeoutSecs, signal);
        this.#url = actor.standbyUrl!;
        const buildRef = actor.actorStandby?.build || 'latest';

        let buildId = actor.taggedBuilds?.[buildRef]?.buildId ?? undefined;
        if (buildId === undefined) {
            // Not a tag, so look `buildRef` up as a build number, which the API can't resolve directly.
            const builds = new BuildCollectionClient(this.subResourceOptions({ resourcePath: 'builds' }));
            for await (const build of builds.list({ desc: true, timeoutSecs, signal })) {
                if (build.buildNumber === buildRef) {
                    buildId = build.id;
                    break;
                }
            }
        }

        const build =
            buildId === undefined
                ? undefined
                : await new BuildClient({
                      baseUrl: this.apifyClient.baseUrl,
                      publicBaseUrl: this.apifyClient.publicBaseUrl,
                      httpClient: this.httpClient,
                      apifyClient: this.apifyClient,
                      id: buildId,
                  }).get({ timeoutSecs, signal });
        if (build === undefined) {
            throw new ApifyClientError(`Build ${buildRef} of Actor ${this.id} does not exist.`);
        }

        return build.actorDefinition?.webServerSchema;
    }

    /**
     * Sends an HTTP request to the Actor's server.
     *
     * The request goes to the URL returned by {@link getUrl} and carries the client's token in the
     * `X-Apify-Authorization` header, which the platform consumes, so it never reaches the Actor's code. Headers you
     * pass, `Authorization` included, reach the Actor's server as they are. The first request to an idle Actor waits
     * for the platform to start a server run, which is why the timeout defaults to `'long'`.
     *
     * The method resolves to any response of the server, error statuses included. A rate-limit (429) or Service
     * Unavailable (503) response is retried with the client's retry settings, and the last one is returned once the
     * retries run out. Request bodies are sent uncompressed unless `compression` is set, since the Actor's server may
     * not decode a compressed body.
     *
     * @template T - Type of the parsed response body.
     * @param path - The path on the Actor's server, for example `/search`. It is always resolved against the server
     * URL, so the request, and the token with it, can't be sent to another host. Pass the query in `params`.
     * @param options - Request options
     * @param options.method - HTTP method of the request. Default is `'GET'`.
     * @param options.params - Query parameters of the request, converted the same way as for API calls.
     * @param options.headers - Additional headers of the request.
     * @param options.data - Request body, serialized the same way as for API calls: a plain object or array is sent
     * as JSON, and a string or binary value as it is.
     * @param options.compression - Compression algorithm for the request body, as a name or an {@link HttpCompressor}.
     * The body is compressed under the same conditions as for API calls. Set it only if the Actor's server decodes
     * the resulting `Content-Encoding`.
     * @param options.responseType - How to return the response body: `'parsed'` by its content type, `'buffer'` as
     * raw bytes, or `'stream'` as a Readable stream with the body unread. A stream holds its connection open until
     * you consume it to the end or destroy it. Node.js only. Default is `'parsed'`.
     * @param options.timeoutSecs - Timeout for the HTTP request. Default is `'long'`. With `'stream'`, it bounds the
     * wait for the server to start responding.
     * @returns The response of the Actor's server, with the body in the form `responseType` asks for
     * @throws {ApifyClientError} When the Actor is not a Server Actor.
     * @throws {ApifyApiError} When the Actor does not exist.
     * @see https://docs.apify.com/platform/actors/running/standby
     */
    async request<T = any>(
        path?: string,
        options?: ActorServerRequestOptions & { responseType?: 'parsed' },
    ): Promise<ApifyResponse<T>>;

    async request(
        path: string,
        options: ActorServerRequestOptions & { responseType: 'buffer' },
    ): Promise<ApifyResponse<Buffer>>;

    async request(
        path: string,
        options: ActorServerRequestOptions & { responseType: 'stream' },
    ): Promise<ApifyResponse<Readable>>;

    async request(path?: string, options?: ActorServerRequestOptions): Promise<ApifyResponse>;

    async request(path = '/', options: ActorServerRequestOptions = {}): Promise<ApifyResponse> {
        parseArgument(path, z.string());
        const {
            method = 'GET',
            params,
            headers,
            data,
            compression,
            responseType,
            timeoutSecs = 'long',
            signal,
        } = parseArgument(options, requestOptionsSchema, 'ActorServerRequestOptions');

        if (responseType === 'stream' && !runtime.isNode) {
            throw new Error("The 'stream' response type can only be used in Node.js environment.");
        }

        const serverUrl = await this.getUrl({ signal });
        return this.httpClient.call({
            url: `${serverUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`,
            method,
            params,
            headers,
            data,
            compression: compression === undefined ? false : resolveCompressor(compression),
            authorizationHeader: 'X-Apify-Authorization',
            throwOnErrorStatus: false,
            retryStatusCodes: SERVER_RETRY_STATUS_CODES,
            responseType,
            timeoutSecs,
            signal,
        });
    }

    /**
     * Fetches the Actor and checks that it is a Server Actor.
     */
    async #getServerActor(
        timeoutSecs: TimeoutOptions['timeoutSecs'],
        signal: AbortSignal | undefined,
    ): Promise<ActorResource> {
        const response = await this.httpClient.call({
            url: this.buildUrl(),
            method: 'GET',
            params: this.buildParams(),
            timeoutSecs,
            signal,
        });
        const actor = parseResponse<ActorResource>(response, schemas.ActorResource());
        if (!actor.standbyUrl) {
            throw new ApifyClientError(`Actor ${this.id} is not a Server Actor.`);
        }
        return actor;
    }
}

/**
 * Options of {@link ActorServerClient.request}.
 */
export interface ActorServerRequestOptions extends TimeoutOptions {
    /** HTTP method of the request. @default 'GET' */
    method?: HttpMethod;
    /** Query parameters of the request, converted the same way as for API calls. */
    params?: Record<string, unknown>;
    /** Additional headers of the request. */
    headers?: Record<string, string>;
    /**
     * Request body, serialized the same way as for API calls: a plain object or array is sent as JSON, and a string
     * or binary value as it is.
     */
    data?: unknown;
    /**
     * Compression algorithm for the request body, as a name or an {@link HttpCompressor}. The body is sent
     * uncompressed when it's not set, since the Actor's server may not decode a compressed body.
     */
    compression?: HttpCompressionAlgorithm | HttpCompressor;
    /**
     * How to return the response body: `'parsed'` by its content type, `'buffer'` as raw bytes, or `'stream'` as a
     * Readable stream with the body unread. Node.js only.
     * @default 'parsed'
     */
    responseType?: ApifyResponseType;
}
