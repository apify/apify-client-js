import type http from 'node:http';
import type https from 'node:https';
import type { Socket } from 'node:net';

import type { AxiosInstance, AxiosInterceptorManager, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError, AxiosHeaders } from 'axios';

import { isNode, isStream } from '../utils.js';
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
}

/**
 * The default HTTP client of {@link ApifyClient}, built on [axios](https://axios-http.com).
 *
 * It inherits the request pipeline from {@link HttpClient} and adds the transport: in Node.js, keep-alive agents
 * that honor the `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables; in the browser, the XHR
 * adapter of axios. Network errors are retried, timeouts included, and a stream body is sent without following
 * redirects, since the part of it already sent could not be replayed.
 */
export class AxiosHttpClient extends HttpClient {
    /** The axios instance the requests go through. */
    axios: AxiosInstance;

    /**
     * Keep-alive agent for plain HTTP, created with the first request in Node.js. It is the same `ProxyAgent` as
     * {@link httpsAgent}, so the socket pool is shared across both schemes.
     */
    httpAgent?: http.Agent;

    /** Keep-alive agent for HTTPS. The same instance as {@link httpAgent}. */
    httpsAgent?: https.Agent;

    private nodeInitPromise?: Promise<void>;

    constructor(options: AxiosHttpClientOptions = {}) {
        super(options);

        this.axios = axios.create({
            // The agents handle the proxy environment variables.
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
     * Destroys the keep-alive agents, closing every pooled socket. A client that never sent a request in Node.js
     * has nothing to close.
     */
    override async close(): Promise<void> {
        // A failed initialization left nothing to release, and its error belongs to the request that hit it.
        await this.nodeInitPromise?.catch(() => {});
        this.httpAgent?.destroy();
        this.httpsAgent?.destroy();
    }

    /**
     * Sends the request through axios and hands the raw response back. A stream body is sent without following
     * redirects, since the part of it already sent could not be replayed.
     */
    override async sendRequest(request: HttpRequest): Promise<HttpResponse> {
        await this.ensureNodeInit();

        const { method, url, headers, body, timeoutMillis, stream } = request;
        const response = await this.axios.request({
            method,
            url,
            headers,
            data: body,
            timeout: timeoutMillis,
            responseType: stream ? 'stream' : 'arraybuffer',
            // See axios/axios#1045 for why axios must not buffer a stream body to follow redirects.
            ...(isStream(body) ? { maxRedirects: 0 } : {}),
        });

        return {
            status: response.status,
            headers: AxiosHeaders.from(response.headers as Record<string, string>).toJSON() as HttpResponseHeaders,
            body: response.data as HttpResponseBody,
        };
    }

    private async ensureNodeInit(): Promise<void> {
        if (!isNode()) return;

        this.nodeInitPromise ??= this.initNode();

        return this.nodeInitPromise;
    }

    private async initNode(): Promise<void> {
        const { ProxyAgent } = await import('proxy-agent');

        // Sockets are pooled and reused, which is what makes a burst of API calls cheap.
        const agentOptions: http.AgentOptions & { scheduling?: 'lifo' | 'fifo' } = {
            keepAlive: true,
            // An idle socket that is never claimed again would leak, so cap how long one may sit unused.
            timeout: this.timeoutMillis,
            keepAliveMsecs: 15_000,
            maxSockets: 256,
            maxFreeSockets: 256,
            // Reusing the most recently used socket keeps the rest of the pool free to expire.
            scheduling: 'lifo',
        };

        // `ProxyAgent` reads the proxy environment variables itself and tunnels over CONNECT when needed.
        const proxyAgent = new ProxyAgent(agentOptions);
        this.httpAgent = proxyAgent;
        this.httpsAgent = proxyAgent;

        // API calls are small and latency-sensitive, so send each write out instead of waiting for a full packet.
        const setNoDelay = (socket: Socket) => {
            socket.setNoDelay(true);
        };

        this.httpAgent.on('socket', setNoDelay);
        this.httpsAgent.on('socket', setNoDelay);

        this.axios.defaults.httpAgent = this.httpAgent;
        this.axios.defaults.httpsAgent = this.httpsAgent;
    }
}
