// eslint-disable-next-line max-classes-per-file
import type { Readable } from 'node:stream';

import c from 'ansi-colors';
import { z } from 'zod';

import type { Log } from '@apify/log';
import log, { Logger, LogLevel } from '@apify/log';

import type { ApifyApiError } from '../apify_api_error.js';
import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceClient } from '../base/resource_client.js';
import type { ApifyRequestConfig } from '../http_clients/index.js';
import type { TimeoutOptions } from '../timeouts.js';
import { timeoutOptionsShape } from '../timeouts.js';
import { cast, catchNotFoundForResourceOrThrow, concatBytes, parseArgument, sleep } from '../utils.js';

/**
 * Pause before the first reopen of a log stream that ended before the run logged anything. Each further reopen doubles
 * the pause up to `EMPTY_LOG_STREAM_MAX_RETRY_MILLIS`, which bounds the request rate while a run waits long to start,
 * for example for free memory.
 */
const EMPTY_LOG_STREAM_RETRY_MILLIS = 500;

/** Upper bound on the pause between reopens of an empty log stream. */
const EMPTY_LOG_STREAM_MAX_RETRY_MILLIS = 5_000;

const logOptionsSchema = z.strictObject({ raw: z.boolean().optional(), ...timeoutOptionsShape });

/** How long `StreamedLog.stop()` waits for lines already in flight before aborting the log stream request. */
const STOP_GRACE_MILLIS = 1000;

/**
 * Client for accessing Actor run or build logs.
 *
 * Provides methods to retrieve logs as text or stream them in real-time. Logs can be accessed
 * for both running and finished Actor runs and builds.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const runClient = client.run('my-run-id');
 *
 * // Get the log content
 * const log = await runClient.log().get();
 * console.log(log);
 *
 * // Stream the log in real-time
 * const stream = await runClient.log().stream();
 * stream.on('line', (line) => console.log(line));
 * ```
 *
 * @see https://docs.apify.com/platform/actors/running/runs-and-builds#logging
 */
export class LogClient extends ResourceClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'logs',
            ...options,
        });
    }

    /**
     * Retrieves the log as a string.
     *
     * @param options - Log retrieval options.
     * @param options.raw - If `true`, returns raw log content without any processing. Default is `false`.
     * @param options.timeoutSecs - Timeout for the API request. Default is `'long'`.
     * @returns The log content as a string, or `undefined` if it does not exist. A chained client such as
     * `run.log()` throws an `ApifyApiError` on a 404, since the run itself may be what is missing.
     * @see https://docs.apify.com/api/v2/log-get
     */
    async get(options: LogOptions = {}): Promise<string | undefined> {
        const { timeoutSecs = 'long', signal, ...params } = parseArgument(options, logOptionsSchema, 'LogOptions');

        const requestOpts: ApifyRequestConfig = {
            url: this.buildUrl(),
            method: 'GET',
            params: this.buildParams(params),
            timeoutSecs,
            signal,
        };

        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(response.data);
        } catch (err) {
            catchNotFoundForResourceOrThrow(err as ApifyApiError, this.id);
        }

        return undefined;
    }

    /**
     * Retrieves the log as a Readable stream. Only works in Node.js.
     *
     * @param options - Log retrieval options.
     * @param options.raw - If `true`, returns raw log content without any processing. Default is `false`.
     * @param options.timeoutSecs - Timeout for the API request. Default is `'long'`.
     * @returns The log content as a Readable stream, or `undefined` if it does not exist. A chained client such as
     * `run.log()` throws an `ApifyApiError` on a 404, since the run itself may be what is missing.
     * @see https://docs.apify.com/api/v2/log-get
     */
    async stream(options: LogOptions = {}): Promise<Readable | undefined> {
        const { timeoutSecs = 'long', signal, raw } = parseArgument(options, logOptionsSchema, 'LogOptions');

        const params = {
            stream: true,
            raw,
        };

        const requestOpts: ApifyRequestConfig = {
            url: this.buildUrl(),
            method: 'GET',
            params: this.buildParams(params),
            responseType: 'stream',
            timeoutSecs,
            signal,
        };

        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(response.data);
        } catch (err) {
            catchNotFoundForResourceOrThrow(err as ApifyApiError, this.id);
        }

        return undefined;
    }
}

/**
 * @since Added in 2.20.0
 */
export interface LogOptions extends TimeoutOptions {
    /** @default false */
    raw?: boolean;
}

/**
 * Logger for redirected actor logs.
 * @since Added in 2.20.0
 */
export class LoggerActorRedirect extends Logger {
    constructor(options = {}) {
        super({ skipTime: true, level: LogLevel.DEBUG, ...options });
    }

    override _log(level: LogLevel, message: string, data?: any, exception?: unknown, opts: Record<string, any> = {}) {
        if (level > this.options.level) {
            return;
        }
        if (data || exception) {
            throw new Error('Redirect logger does not use other arguments than level and message');
        }
        let { prefix } = opts;
        prefix = prefix ? `${prefix}` : '';

        let maybeDate = '';
        if (!this.options.skipTime) {
            maybeDate = `${new Date().toISOString().replace('Z', '').replace('T', ' ')} `;
        }

        const line = `${c.gray(maybeDate)}${c.cyan(prefix)}${message || ''}`;

        // All redirected logs are logged at info level to avid any console specific formating for non-info levels,
        // which have already been applied once to the original log. (For example error stack traces etc.)
        this._outputWithConsole(LogLevel.INFO, line);
        return line;
    }
}

/**
 * Helper class for redirecting streamed Actor logs to another log.
 * @since Added in 2.20.0
 */
export class StreamedLog {
    #destinationLog: Log;
    #streamBuffer: Uint8Array[] = [];
    #decoder = new TextDecoder();
    #splitMarker = /(?:\n|^)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g;
    #relevancyTimeLimit: Date | null;

    #logClient: LogClient;
    #signal: AbortSignal | undefined;
    #streamingTask: Promise<void> | null = null;
    #stopLogging = false;
    #stopController = new AbortController();
    #wakeController = new AbortController();

    constructor(options: StreamedLogOptions) {
        const { toLog, logClient, fromStart = true, signal } = options;
        this.#destinationLog = toLog;
        this.#logClient = logClient;
        this.#signal = signal;
        this.#relevancyTimeLimit = fromStart ? null : new Date();
    }

    /**
     * Start log redirection.
     */
    public start(): void {
        if (this.#streamingTask) {
            throw new Error('Streaming task already active');
        }
        this.#stopLogging = false;
        this.#stopController = new AbortController();
        this.#wakeController = new AbortController();
        this.#streamingTask = this.#streamLog();
    }

    /**
     * Stop log redirection. Waits up to one second for lines already in flight, then aborts the log stream request. If
     * no stream has delivered anything yet, reads the whole log in one request instead.
     */
    public async stop(): Promise<void> {
        if (!this.#streamingTask) {
            throw new Error('Streaming task is not active');
        }
        this.#stopLogging = true;
        this.#wakeController.abort();
        const stopController = this.#stopController;
        const abortTimeout = setTimeout(() => stopController.abort(), STOP_GRACE_MILLIS);
        try {
            await this.#streamingTask;
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                throw err;
            }
        } finally {
            clearTimeout(abortTimeout);
            this.#streamingTask = null;
        }
    }

    /**
     * Get log stream from response and redirect it to another log.
     */
    async #streamLog(): Promise<void> {
        const signal = this.#signal
            ? AbortSignal.any([this.#signal, this.#stopController.signal])
            : this.#stopController.signal;
        try {
            let lastChunkRemainder: Uint8Array | undefined;
            let retryMillis = EMPTY_LOG_STREAM_RETRY_MILLIS;
            // The API serves the log of a run that has not logged anything yet as an empty stream that ends at once,
            // so reopen it until the first bytes arrive. Once stopped, read whatever the log holds in one request.
            while (!lastChunkRemainder) {
                if (this.#stopLogging) {
                    // `signal` is aborted once the stop grace period ends, which would cut this read short.
                    const logContent = await this.#logClient.get({ raw: true, signal: this.#signal });
                    lastChunkRemainder = await this.#logStreamChunks(
                        [new TextEncoder().encode(logContent ?? '')],
                        signal,
                    );
                    break;
                }
                let logStream: Readable | undefined;
                try {
                    logStream = await this.#logClient.stream({ raw: true, signal });
                } catch (err) {
                    // The stop grace period ended while the stream was connecting, so read the log in one request.
                    if (this.#stopLogging && !this.#signal?.aborted) continue;
                    throw err;
                }
                if (!logStream) {
                    return;
                }
                // A stream opened during stop() would be cut after its first chunk, so read the log in one request.
                if (this.#stopLogging) {
                    logStream.destroy();
                    continue;
                }
                lastChunkRemainder = await this.#logStreamChunks(logStream, signal);
                if (!lastChunkRemainder) {
                    await sleep(retryMillis, AbortSignal.any([signal, this.#wakeController.signal]));
                    retryMillis = Math.min(retryMillis * 2, EMPTY_LOG_STREAM_MAX_RETRY_MILLIS);
                }
            }
            // Process whatever is left when exiting. Maybe it is incomplete, maybe it is last log without EOL.
            const lastMessage = this.#decoder.decode(lastChunkRemainder).trim();
            if (lastMessage.length) {
                this.#destinationLog.info(lastMessage);
            }
        } catch (err) {
            if (signal.aborted) return;
            log.warning(`Log redirection stopped due to error`, err as Error);
        }
    }

    /**
     * Redirect every complete message in the chunks and return the incomplete rest, or `undefined` when there were no
     * chunks at all.
     */
    async #logStreamChunks(
        logStream: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
        signal: AbortSignal,
    ): Promise<Uint8Array | undefined> {
        // Chunk may be incomplete. Keep remainder for next chunk.
        let previousChunkRemainder: Uint8Array | undefined;

        try {
            for await (const chunk of logStream) {
                // Handle possible leftover incomplete line from previous chunk.
                // Everything before last end of line is complete.
                previousChunkRemainder ??= new Uint8Array();
                const chunkWithPreviousRemainder = new Uint8Array(previousChunkRemainder.length + chunk.length);
                chunkWithPreviousRemainder.set(previousChunkRemainder, 0);
                chunkWithPreviousRemainder.set(chunk, previousChunkRemainder.length);

                const lastCompleteMessageIndex = chunkWithPreviousRemainder.lastIndexOf(0x0a);
                previousChunkRemainder = chunkWithPreviousRemainder.slice(lastCompleteMessageIndex);

                // Push complete part of the chunk to the buffer
                this.#streamBuffer.push(chunkWithPreviousRemainder.slice(0, lastCompleteMessageIndex));
                this.#logBufferContent();

                // Keep processing the new data until stopped
                if (this.#stopLogging) {
                    break;
                }
            }
        } catch (err) {
            // An aborted stream still hands back its unterminated last line, so the caller can flush it.
            if (!signal.aborted) throw err;
        }
        return previousChunkRemainder;
    }

    /**
     * Parse the buffer and log complete messages.
     */
    #logBufferContent(): void {
        const allParts = this.#decoder.decode(concatBytes(this.#streamBuffer)).split(this.#splitMarker).slice(1);
        // Parse the buffer parts into complete messages
        const messageMarkers = allParts.filter((_, i) => i % 2 === 0);
        const messageContents = allParts.filter((_, i) => i % 2 !== 0);
        this.#streamBuffer = [];

        messageMarkers.forEach((marker, index) => {
            const decodedMarker = marker;
            const decodedContent = messageContents[index];
            if (this.#relevancyTimeLimit) {
                // Log only relevant messages. Ignore too old log messages.
                const logTime = new Date(decodedMarker);
                if (logTime < this.#relevancyTimeLimit) {
                    return;
                }
            }
            const message = decodedMarker + decodedContent;

            // Original log level information is not available. Log all on info level. Log level could be guessed for
            // some logs, but for any multiline logs such guess would be probably correct only for the first line.
            this.#destinationLog.info(message.trim());
        });
    }
}

/**
 * @since Added in 2.20.0
 */
export interface StreamedLogOptions {
    /** Log client used to communicate with the Apify API. */
    logClient: LogClient;
    /** Log to which the Actor run logs will be redirected. */
    toLog: Log;
    /** Whether to redirect all logs from Actor run start (even logs from the past). */
    fromStart?: boolean;
    /** Ends the log stream once it aborts. */
    signal?: AbortSignal;
}
