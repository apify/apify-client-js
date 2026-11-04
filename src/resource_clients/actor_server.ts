import type { Readable } from 'node:stream';

import ow from 'ow';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { DEFAULT_TIMEOUT_MILLIS, ResourceClient, SMALL_TIMEOUT_MILLIS } from '../base/resource_client';
import type { ApifyRequestConfig, ApifyResponse } from '../http_client';
import { isNode } from '../utils';
import type { Actor } from './actor';
import type { Build } from './build';
import { BuildCollectionClient } from './build_collection';

/**
 * Statuses a server request is retried on. The platform answers with them when it can't pass a request to a server
 * run, so a retry usually doesn't run the Actor's code again. An Actor that returns one itself gets the request again.
 */
const SERVER_RETRY_STATUS_CODES = [429, 503];

const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'];

const BUILD_NUMBER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * Splits a build number like `0.1.23` into its version and sequence number, or returns `undefined` for anything else.
 */
function parseBuildNumber(buildNumber: string | null | undefined): [number, number, number] | undefined {
    const match = BUILD_NUMBER_PATTERN.exec(buildNumber ?? '');
    if (!match) return undefined;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Returns whether `buildNumber` belongs to the same version as `target` and comes before it. Builds are listed newest
 * first and the sequence numbers of a version grow over time, so meeting such a build means the target doesn't exist.
 */
function isOlderBuild(buildNumber: string | null | undefined, target: [number, number, number]): boolean {
    const parsed = parseBuildNumber(buildNumber);
    return parsed !== undefined && parsed[0] === target[0] && parsed[1] === target[1] && parsed[2] < target[2];
}

/**
 * Merges two header records, header names compared case-insensitively. A header from `override` replaces a
 * same-named header in `base` whatever the casing of either.
 */
function mergeHeaders(
    base: Record<string, string | null>,
    override: Record<string, string | null> = {},
): Record<string, string | null> {
    const overridden = new Set(Object.keys(override).map((name) => name.toLowerCase()));
    const kept = Object.entries(base).filter(([name]) => !overridden.has(name.toLowerCase()));
    return { ...Object.fromEntries(kept), ...override };
}

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
 * @since Added in 2.26.0
 */
export class ActorServerClient extends ResourceClient {
    /**
     * The server URL. Getting it takes an API call for the Actor, so it's cached for {@link getUrl} and
     * {@link request}. It's pending while the first lookup runs, so concurrent first calls share one API request.
     */
    private _serverUrl?: Promise<string>;

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
     * {@link getOpenApiSpec} and reused by later calls on this client. Use it to call the server with another HTTP
     * client, for example one generated from the server's OpenAPI specification.
     *
     * @returns The URL of the Actor's server
     * @throws When the Actor does not exist or is not a Server Actor.
     * @see https://docs.apify.com/platform/actors/running/standby
     */
    async getUrl(): Promise<string> {
        const url = (this._serverUrl ??= this._getServerActor().then((actor) => actor.standbyUrl!));
        try {
            return await url;
        } catch (err) {
            // A failed lookup is not kept, so the next call tries again.
            if (this._serverUrl === url) this._serverUrl = undefined;
            throw err;
        }
    }

    /**
     * Returns the OpenAPI specification of the Actor's server.
     *
     * The specification is the web server schema from the Actor's definition, taken from the build that serves the
     * server interface: the build set in `actorStandby.build`, or `latest` if none is set. Use it to generate an HTTP
     * client for the server, and point that client at the URL returned by {@link getUrl}.
     *
     * @returns The OpenAPI specification of the Actor's server, or `undefined` if the Actor's definition doesn't
     * include one
     * @throws When the Actor does not exist or is not a Server Actor, or the build that serves its server interface
     * doesn't exist.
     * @see https://docs.apify.com/platform/actors/development/actor-definition/web-server-schema
     */
    async getOpenApiSpec(): Promise<Record<string, unknown> | undefined> {
        const actor = await this._getServerActor();
        const buildRef = actor.actorStandby?.build || 'latest';

        let buildId = actor.taggedBuilds?.[buildRef]?.buildId;
        const targetBuildNumber = parseBuildNumber(buildRef);
        if (buildId === undefined && targetBuildNumber !== undefined) {
            // Not a tag, so look `buildRef` up as a build number, which the API can't resolve directly.
            const builds = new BuildCollectionClient(this._subResourceOptions({ resourcePath: 'builds' }));
            for await (const build of builds.list({ desc: true })) {
                // The API lists builds with their build number, though the list item type omits it.
                const { buildNumber } = build as typeof build & Partial<Pick<Build, 'buildNumber'>>;
                if (buildNumber === buildRef) {
                    buildId = build.id;
                    break;
                }
                if (isOlderBuild(buildNumber, targetBuildNumber)) break;
            }
        }

        const build = buildId === undefined ? undefined : await this.apifyClient.build(buildId).get();
        if (build === undefined) {
            throw new Error(`Build ${buildRef} of Actor ${this.id} does not exist.`);
        }

        return build.actorDefinition?.webServerSchema;
    }

    /**
     * Sends an HTTP request to the Actor's server.
     *
     * The request goes to the URL returned by {@link getUrl} and carries the client's token in the
     * `X-Apify-Authorization` header, which the platform consumes, so it never reaches the Actor's code. Headers you
     * pass, `Authorization` included, reach the Actor's server as they are. The first request to an idle Actor waits
     * for the platform to start a server run, which is why the timeout defaults to the client's longest one.
     *
     * The method resolves to any response of the server, error statuses included. A rate-limit (429) or Service
     * Unavailable (503) response is retried with the client's retry settings, and the last one is returned once the
     * retries run out. The Actor's code can return these statuses too, and then it gets the request again. Network
     * errors and timeouts are not retried, since the Actor may have already handled the request. A redirect is
     * returned as it is, since following it would send the token to a host the Actor's code picked. A browser follows
     * redirects itself, though, so there the token goes with a redirect. Request bodies are sent uncompressed, since
     * the Actor's server may not decode a compressed body.
     *
     * @template T - Type of the parsed response body.
     * @param path - The path on the Actor's server, for example `/search`. It is always resolved against the server
     * URL, so the request, and the token with it, can't be sent to another host. Pass the query in `params`. A
     * fragment (`#...`) is dropped, since it's never sent to the server.
     * @param options - Request options
     * @param options.method - HTTP method of the request. Default is `'GET'`.
     * @param options.params - Query parameters of the request, converted the same way as for API calls.
     * @param options.headers - Additional headers of the request.
     * @param options.data - Request body, serialized the same way as for API calls: a plain object or array is sent
     * as JSON, and a string or binary value as it is.
     * @param options.responseType - How to return the response body: `'parsed'` by its content type, `'buffer'` as
     * raw bytes, or `'stream'` as a Readable stream with the body unread. A stream holds its connection open until
     * you consume it to the end or destroy it. Node.js only. Default is `'parsed'`.
     * @param options.timeoutSecs - Timeout for the HTTP request in seconds. Default is the client's timeout.
     * @returns The response of the Actor's server, with the body in the form `responseType` asks for. An error
     * response whose body doesn't parse as its content type comes with the raw bytes in `data`.
     * @throws When the Actor does not exist or is not a Server Actor, or the request fails or times out.
     * @throws {InvalidResponseBodyError} When a success response's body doesn't parse as its content type, with
     * `responseType: 'parsed'`.
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
        ow(path, ow.string);
        const { data, ...rest } = options;
        ow(
            rest,
            ow.object.exactShape({
                method: ow.optional.string.oneOf(HTTP_METHODS),
                params: ow.optional.object,
                headers: ow.optional.object.valuesOfType(ow.string),
                responseType: ow.optional.string.oneOf(['parsed', 'buffer', 'stream']),
                timeoutSecs: ow.optional.number.positive,
            }),
        );
        const { method = 'GET', params, headers, responseType, timeoutSecs } = rest;

        if (responseType === 'stream' && !isNode()) {
            throw new Error("The 'stream' response type can only be used in Node.js environment.");
        }

        const serverUrl = await this.getUrl();
        const serverPath = path.split('#')[0].replace(/^\/+/, '');

        // The token goes in `X-Apify-Authorization`, which the platform strips, and the client's default
        // `Authorization` header is dropped (`null`) so the caller's own one, if any, reaches the Actor.
        const authHeaders: Record<string, string | null> = { Authorization: null };
        if (this.apifyClient.token) authHeaders['X-Apify-Authorization'] = `Bearer ${this.apifyClient.token}`;
        const requestHeaders = mergeHeaders(authHeaders, headers);

        const config: ApifyRequestConfig = {
            url: `${serverUrl.replace(/\/+$/, '')}/${serverPath}`,
            method,
            params,
            headers: requestHeaders,
            data,
            doNotCompress: true,
            throwOnErrorStatus: false,
            retryStatusCodes: SERVER_RETRY_STATUS_CODES,
            retryTransportErrors: false,
            maxRedirects: 0,
            timeout: timeoutSecs !== undefined ? timeoutSecs * 1000 : DEFAULT_TIMEOUT_MILLIS,
        };
        if (responseType === 'buffer') config.forceBuffer = true;
        if (responseType === 'stream') config.responseType = 'stream';

        return this.httpClient.call(config);
    }

    /**
     * Fetches the Actor, checks that it is a Server Actor, and caches its server URL.
     */
    private async _getServerActor(): Promise<Actor> {
        const actor = await this._get<object, Actor>({}, SMALL_TIMEOUT_MILLIS);
        if (!actor) {
            throw new Error(`Actor ${this.id} does not exist.`);
        }
        if (!actor.standbyUrl) {
            throw new Error(`Actor ${this.id} is not a Server Actor.`);
        }
        this._serverUrl = Promise.resolve(actor.standbyUrl);
        return actor;
    }
}

/**
 * Options of {@link ActorServerClient.request}.
 * @since Added in 2.26.0
 */
export interface ActorServerRequestOptions {
    /** HTTP method of the request. @default 'GET' */
    method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
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
     * How to return the response body: `'parsed'` by its content type, `'buffer'` as raw bytes, or `'stream'` as a
     * Readable stream with the body unread. Node.js only.
     * @default 'parsed'
     */
    responseType?: 'parsed' | 'buffer' | 'stream';
    /** Timeout for the HTTP request in seconds. Default is the client's timeout. */
    timeoutSecs?: number;
}
