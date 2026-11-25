import { runtime } from '#runtime';
import { ApifyClientError } from '../apify_client_error.js';
import { isStream } from '../utils.js';
import type { HttpClientOptions, HttpRequest, HttpResponse, HttpResponseHeaders } from './base.js';
import { HttpClient } from './base.js';

/**
 * A function with the signature of the global [`fetch`](https://developer.mozilla.org/docs/Web/API/Window/fetch).
 */
export type FetchFunction = typeof globalThis.fetch;

/**
 * Configuration of {@link FetchHttpClient}.
 */
export interface FetchHttpClientOptions extends HttpClientOptions {
    /**
     * The `fetch` implementation the requests go through. Pass a wrapper around the global `fetch` to adjust every
     * request, or the `fetch` of another library, such as `undici` with a dispatcher of your own, to control the
     * connections.
     * @default globalThis.fetch
     */
    fetch?: FetchFunction;
}

/** Error codes of the timeouts that Node.js reports as the `cause` of a failed `fetch`. */
const TIMEOUT_ERROR_CODES = new Set([
    'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
]);

/** Error codes of a request that Node.js or Bun refused to send, so sending it again fails the same way. */
const INVALID_REQUEST_ERROR_CODES = new Set([
    'ERR_INVALID_URL',
    'ERR_INVALID_ARG_TYPE',
    'ERR_INVALID_ARG_VALUE',
    'UND_ERR_INVALID_ARG',
    'UND_ERR_REQ_CONTENT_LENGTH_MISMATCH',
]);

/**
 * The default HTTP client of {@link ApifyClient}, built on the `fetch` of the runtime, so it works the same way in
 * Node.js, browsers and edge runtimes and brings no dependency of its own.
 *
 * It inherits the request pipeline from {@link HttpClient} and adds the transport. Network errors are retried,
 * timeouts included, and a stream body is sent without following redirects, since the part of it already sent could
 * not be replayed. The timeout of a request runs until the response headers arrive and starts over with every chunk
 * of the body, so a large download does not time out while it makes progress.
 *
 * In Node.js, `fetch` keeps connections alive on its own, and goes through a proxy only when Node.js is told to
 * read the `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` environment variables: start it with `NODE_USE_ENV_PROXY=1`
 * (Node.js 22.21 and 24.0) or `--use-env-proxy` (Node.js 22.21 and 24.5).
 */
export class FetchHttpClient extends HttpClient {
    readonly #fetch?: FetchFunction;

    constructor(options: FetchHttpClientOptions = {}) {
        super(options);
        this.#fetch = options.fetch;
    }

    /**
     * A timeout is the `TimeoutError` this client aborts a late request with, or a `fetch` failure caused by one of
     * the connection, headers and body timeouts of Node.js.
     */
    override isTimeoutError(error: unknown): boolean {
        if (super.isTimeoutError(error)) return true;
        const code = causeCode(error);
        return code !== undefined && TIMEOUT_ERROR_CODES.has(code);
    }

    /**
     * A network failure is the `TypeError` that `fetch` rejects with: a connection that could not be made, dropped
     * mid-way or timed out. In Node.js it carries the failure as its `cause`, which tells it apart from a request
     * that was never sent, such as one with an invalid URL. Bun rejects with an `Error` that has a `code` instead.
     */
    override isRetryableTransportError(error: unknown): boolean {
        if (this.isTimeoutError(error)) return true;
        const code = causeCode(error) ?? errorCode(error);
        if (code !== undefined && INVALID_REQUEST_ERROR_CODES.has(code)) return false;
        if (runtime.fetchFailsWithCause) return error instanceof TypeError && error.cause !== undefined;
        // Browsers and Deno fail with a bare `TypeError` whatever the reason, and Bun with an error that has a `code`.
        return error instanceof TypeError || code !== undefined;
    }

    /**
     * Sends the request through `fetch` and hands the raw response back. A stream body is sent without following
     * redirects, and so is a request with `followRedirects: false`. A browser hides such a redirect response from
     * the page, so there it fails the request.
     */
    override async sendRequest(request: HttpRequest): Promise<HttpResponse> {
        const { method, url, headers, body, timeoutMillis, stream, followRedirects, signal } = request;

        // `AbortSignal.timeout()` could neither be restarted nor called off.
        const timeout = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const restartTimeout = () => {
            clearTimeout(timer);
            if (timeoutMillis === undefined) return;
            timer = setTimeout(
                () => timeout.abort(new DOMException(`timeout of ${timeoutMillis}ms exceeded`, 'TimeoutError')),
                timeoutMillis,
            );
        };
        restartTimeout();

        try {
            const response = await (this.#fetch ?? globalThis.fetch)(url, {
                method,
                headers,
                // Node.js reads a `Readable` as an async iterable, which the DOM types do not know about.
                body: body as BodyInit | undefined,
                redirect: followRedirects && !isStream(body) ? 'follow' : 'manual',
                signal: signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal,
                // Required for a stream body, and ignored for any other.
                ...(isStream(body) ? { duplex: 'half' } : {}),
            } as RequestInit);

            // `redirect: 'manual'` resolves to an opaque response with status 0 in a browser.
            if (response.type === 'opaqueredirect') {
                throw new ApifyClientError(
                    `${method} ${url} responded with a redirect, which the client does not follow.`,
                );
            }

            return {
                status: response.status,
                headers: toResponseHeaders(response.headers),
                // The timeout covers a streamed response only until its headers, and the caller's signal throughout.
                body: stream ? runtime.readableFromWeb(response.body) : await readBody(response, restartTimeout),
            };
        } catch (error) {
            if (!this.#fetch && this.isRetryableTransportError(error)) this.#warnAboutUnusedProxy();
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    /** A proxy the environment names and Node.js ignores is the likeliest reason for a connection to fail. */
    #warnAboutUnusedProxy(): void {
        const hint = runtime.unusedProxyHint();
        if (hint) this.logger.warningOnce(hint);
    }
}

/**
 * Reads the response body chunk by chunk, so that a large download counts as alive for as long as bytes arrive.
 */
async function readBody(response: Response, onChunk: () => void): Promise<Buffer | ArrayBuffer> {
    const chunks: Uint8Array[] = [];
    let length = 0;
    const reader = response.body?.getReader();
    for (let chunk = await reader?.read(); chunk && !chunk.done; chunk = await reader?.read()) {
        onChunk();
        chunks.push(chunk.value);
        length += chunk.value.byteLength;
    }

    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return runtime.isNode ? Buffer.from(bytes.buffer) : bytes.buffer;
}

function toResponseHeaders(headers: Headers): HttpResponseHeaders {
    const result: HttpResponseHeaders = Object.fromEntries(headers);
    // `fetch` joins repeated headers with a comma, which a cookie's `Expires` date makes ambiguous.
    const cookies = headers.getSetCookie?.() ?? [];
    if (cookies.length > 0) result['set-cookie'] = cookies;
    return result;
}

/** Reads the `code` of the error that caused a `fetch` failure, which is where Node.js puts the network error. */
function causeCode(error: unknown): string | undefined {
    return errorCode(error instanceof Error ? error.cause : undefined);
}

function errorCode(error: unknown): string | undefined {
    const code = (error as { code?: unknown } | null | undefined)?.code;
    return typeof code === 'string' ? code : undefined;
}
