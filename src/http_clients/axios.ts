import type http from 'node:http';
import type https from 'node:https';

import type { AxiosInstance, AxiosInterceptorManager, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError, AxiosHeaders } from 'axios';

import { runtime } from '#runtime';
import { ApifyClientError } from '../apify_client_error.js';
import { isStream } from '../utils.js';
import type { HttpClientOptions, HttpRequest, HttpResponse, HttpResponseBody, HttpResponseHeaders } from './base.js';
import { HttpClient } from './base.js';

/**
 * An [axios request interceptor](https://axios-http.com/docs/interceptors). It runs on every attempt, right before
 * the request is handed to axios, and sees the request as the shared pipeline prepared it: headers merged and the
 * body already serialized and compressed.
 */
export type RequestInterceptorFunction = Parameters<AxiosInterceptorManager<InternalAxiosRequestConfig>['use']>[0];

/**
 * Configuration of {@link AxiosHttpClient}.
 */
export interface AxiosHttpClientOptions extends HttpClientOptions {
    /** @default [] */
    requestInterceptors?: RequestInterceptorFunction[];
    /**
     * Agent for plain HTTP requests in Node.js, in place of the built-in keep-alive one. A proxy agent goes here
     * and in {@link httpsAgent}. The client does not destroy an agent it was given.
     */
    httpAgent?: http.Agent;
    /** Agent for HTTPS requests in Node.js, in place of the built-in keep-alive one. Requests to the Apify API use it. */
    httpsAgent?: https.Agent;
}

/**
 * An HTTP client for {@link ApifyClient} built on [axios](https://axios-http.com), which was the transport of the
 * client before version 3. It is exported from `apify-client/axios` and needs the `axios` package installed
 * next to the client.
 *
 * It inherits the request pipeline from {@link HttpClient} and adds the transport: in Node.js, keep-alive agents;
 * in the browser, the XHR adapter of axios, or its fetch adapter for a request that must not follow redirects or
 * that asks for a streamed response.
 * Network errors are retried, timeouts included, and a stream body is sent without following redirects, since the
 * part of it already sent could not be replayed. The proxy environment variables are not read: pass a proxy agent
 * in {@link AxiosHttpClientOptions.httpAgent} and {@link AxiosHttpClientOptions.httpsAgent} instead.
 *
 * @example
 * ```javascript
 * import { ApifyClient } from 'apify-client';
 * import { AxiosHttpClient } from 'apify-client/axios';
 *
 * const client = ApifyClient.withCustomHttpClient({ token: 'my-token', httpClient: new AxiosHttpClient() });
 * ```
 */
export class AxiosHttpClient extends HttpClient {
    /** The axios instance the requests go through. */
    axios: AxiosInstance;

    /** Agent for plain HTTP: the one from the options, or a keep-alive one created with the first request in Node.js. */
    httpAgent?: http.Agent;

    /** Agent for HTTPS: the one from the options, or a keep-alive one created with the first request in Node.js. */
    httpsAgent?: https.Agent;

    /** The built-in agents, which are the ones `close()` destroys. */
    #ownAgents: (http.Agent | https.Agent)[] = [];

    #httpAgentsPromise?: Promise<void>;

    constructor(options: AxiosHttpClientOptions = {}) {
        super(options);

        this.axios = axios.create({
            // Axios cannot tunnel HTTPS through a proxy on its own, so a proxy is left to the agents.
            proxy: false,
            validateStatus: null,
            // The shared pipeline serializes and parses the bodies, so axios only moves bytes.
            transformRequest: [],
            transformResponse: [],
            responseType: 'arraybuffer',
            // maxBodyLength needs to be Infinity, because -1 falls back to a 10 MB default
            // from an axios subdependency - 'follow-redirects'
            maxBodyLength: Infinity,
            // maxContentLength must be -1, because Infinity will cause axios to run super slow
            // thanks to a bug that's now fixed, but not released yet https://github.com/axios/axios/pull/3738
            maxContentLength: -1,
        });

        // The pipeline merges every header the client sends, so the axios defaults would only get in the way.
        this.axios.defaults.headers = new AxiosHeaders() as any;

        this.httpAgent = options.httpAgent;
        this.httpsAgent = options.httpsAgent;

        for (const interceptor of options.requestInterceptors ?? []) {
            this.axios.interceptors.request.use(interceptor);
        }
    }

    /**
     * A timeout is an axios error coded `ECONNABORTED` or `ETIMEDOUT`, besides the `TimeoutError` the base class
     * recognizes.
     */
    override isTimeoutError(error: unknown): boolean {
        if (super.isTimeoutError(error)) return true;
        // Axios aborts the request when its own timeout fires, which gives ECONNABORTED, or ETIMEDOUT under
        // `clarifyTimeoutError`. ETIMEDOUT also arrives straight from the socket, when the connection itself
        // times out.
        return (
            axios.isAxiosError(error) && (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT)
        );
    }

    /**
     * A network failure is an axios error that carries the request it was sending: a connection that could not be
     * made, dropped mid-way or timed out. Errors raised before a request exists, such as an invalid URL, are not
     * retried.
     */
    override isRetryableTransportError(error: unknown): boolean {
        if (!axios.isAxiosError(error)) return false;
        return typeof error.request === 'object' && error.request !== null && error.config != null;
    }

    /**
     * Destroys the built-in keep-alive agents, closing every pooled socket. A client that never sent a request in
     * Node.js has nothing to close, and agents passed in the options are left to their owner.
     */
    override async close(): Promise<void> {
        // A failed initialization left nothing to release, and its error belongs to the request that hit it.
        await this.#httpAgentsPromise?.catch(() => {});
        for (const agent of this.#ownAgents.splice(0)) agent.destroy();
    }

    /**
     * Sends the request through axios and hands the raw response back. A stream body is sent without following
     * redirects, since the part of it already sent could not be replayed, and so is a request with
     * `followRedirects: false`. Outside Node.js, such a request goes through `fetch`, since the browser follows the
     * redirects of an XHR itself, and a redirect response fails the request: `fetch` hides it from the page. A
     * request for a streamed response goes through `fetch` there too, since an XHR cannot stream one.
     */
    override async sendRequest(request: HttpRequest): Promise<HttpResponse> {
        await this.#ensureHttpAgents();

        const { method, url, headers, body, timeoutMillis, stream, followRedirects, signal } = request;
        const useFetch = (!followRedirects || stream) && !runtime.isNode;
        const response = await this.axios.request({
            method,
            url,
            // The fetch adapter adds a `User-Agent` of its own otherwise, which a browser lists in the CORS preflight.
            headers: useFetch ? { 'User-Agent': null, ...headers } : headers,
            data: body,
            // Axios reads 0 as no timeout.
            timeout: timeoutMillis ?? 0,
            signal,
            responseType: stream ? 'stream' : 'arraybuffer',
            // See axios/axios#1045 for why axios must not buffer a stream body to follow redirects. The fetch
            // adapter turns this into `redirect: 'manual'`.
            ...(isStream(body) || !followRedirects ? { maxRedirects: 0 } : {}),
            ...(useFetch ? { adapter: 'fetch' } : {}),
        });

        // `redirect: 'manual'` resolves to an opaque response with status 0 instead of the redirect.
        if (useFetch && response.status === 0) {
            throw new ApifyClientError(`${method} ${url} responded with a redirect, which the client does not follow.`);
        }

        return {
            status: response.status,
            headers: AxiosHeaders.from(response.headers as Record<string, string>).toJSON() as HttpResponseHeaders,
            body: response.data as HttpResponseBody,
        };
    }

    async #ensureHttpAgents(): Promise<void> {
        this.#httpAgentsPromise ??= this.#initHttpAgents();

        return this.#httpAgentsPromise;
    }

    async #initHttpAgents(): Promise<void> {
        const agents = await runtime.createHttpAgents({ timeoutMillis: this.timeoutMaxMillis });
        if (agents) {
            this.httpAgent ??= this.#own(agents.httpAgent);
            this.httpsAgent ??= this.#own(agents.httpsAgent);
        }

        this.axios.defaults.httpAgent = this.httpAgent;
        this.axios.defaults.httpsAgent = this.httpsAgent;
    }

    #own<T extends http.Agent>(agent: T): T {
        this.#ownAgents.push(agent);
        return agent;
    }
}
