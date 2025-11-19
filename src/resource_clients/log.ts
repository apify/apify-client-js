// eslint-disable-next-line max-classes-per-file
import type { Readable } from 'node:stream';

import c from 'ansi-colors';

import type { Log } from '@apify/log';
import { Logger, LogLevel } from '@apify/log';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow } from '../utils';

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
     * https://docs.apify.com/api/v2#/reference/logs/log/get-log
     */
    async get(options: LogOptions = {}): Promise<string | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url(),
            method: 'GET',
            params: this._params(options),
        };

        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(response.data);
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }

    /**
     * Gets the log in a Readable stream format. Only works in Node.js.
     * https://docs.apify.com/api/v2#/reference/logs/log/get-log
     */
    async stream(options: LogOptions = {}): Promise<Readable | undefined> {
        const params = {
            stream: true,
            raw: options.raw,
        };

        const requestOpts: ApifyRequestConfig = {
            url: this._url(),
            method: 'GET',
            params: this._params(params),
            responseType: 'stream',
        };

        try {
            const response = await this.httpClient.call(requestOpts);
            return cast(response.data);
        } catch (err) {
            catchNotFoundOrThrow(err as ApifyApiError);
        }

        return undefined;
    }
}

export interface LogOptions {
    /** @default false */
    raw?: boolean;
}

/**
 * Logger for redirected actor logs.
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
 */
export class StreamedLog {
    private destinationLog: Log;
    private streamBuffer: Buffer[] = [];
    private splitMarker = /(?:\n|^)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g;
    private relevancyTimeLimit: Date | null;

    private logClient: LogClient;
    private streamingTask: Promise<void> | null = null;
    private stopLogging = false;

    constructor(options: StreamedLogOptions) {
        const { toLog, logClient, fromStart = true } = options;
        this.destinationLog = toLog;
        this.logClient = logClient;
        this.relevancyTimeLimit = fromStart ? null : new Date();
    }

    /**
     * Start log redirection.
     */
    public start(): void {
        if (this.streamingTask) {
            throw new Error('Streaming task already active');
        }
        this.stopLogging = false;
        this.streamingTask = this.streamLog();
    }

    /**
     * Stop log redirection.
     */
    public async stop(): Promise<void> {
        if (!this.streamingTask) {
            throw new Error('Streaming task is not active');
        }
        this.stopLogging = true;
        try {
            await this.streamingTask;
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                throw err;
            }
        } finally {
            this.streamingTask = null;
        }
    }

    /**
     * Get log stream from response and redirect it to another log.
     */
    private async streamLog(): Promise<void> {
        const logStream = await this.logClient.stream({ raw: true });
        if (!logStream) {
            return;
        }
        const lastChunkRemainder = await this.logStreamChunks(logStream);
        // Process whatever is left when exiting. Maybe it is incomplete, maybe it is last log without EOL.
        const lastMessage = Buffer.from(lastChunkRemainder).toString().trim();
        if (lastMessage.length) {
            this.destinationLog.info(lastMessage);
        }
    }

    private async logStreamChunks(logStream: Readable): Promise<Uint8Array> {
        // Chunk may be incomplete. Keep remainder for next chunk.
        let previousChunkRemainder: Uint8Array = new Uint8Array();

        for await (const chunk of logStream) {
            // Handle possible leftover incomplete line from previous chunk.
            // Everything before last end of line is complete.
            const chunkWithPreviousRemainder = new Uint8Array(previousChunkRemainder.length + chunk.length);
            chunkWithPreviousRemainder.set(previousChunkRemainder, 0);
            chunkWithPreviousRemainder.set(chunk, previousChunkRemainder.length);

            const lastCompleteMessageIndex = chunkWithPreviousRemainder.lastIndexOf(0x0a);
            previousChunkRemainder = chunkWithPreviousRemainder.slice(lastCompleteMessageIndex);

            // Push complete part of the chunk to the buffer
            this.streamBuffer.push(Buffer.from(chunkWithPreviousRemainder.slice(0, lastCompleteMessageIndex)));
            this.logBufferContent();

            // Keep processing the new data until stopped
            if (this.stopLogging) {
                break;
            }
        }
        return previousChunkRemainder;
    }

    /**
     * Parse the buffer and log complete messages.
     */
    private logBufferContent(): void {
        const allParts = Buffer.concat(this.streamBuffer).toString().split(this.splitMarker).slice(1);
        // Parse the buffer parts into complete messages
        const messageMarkers = allParts.filter((_, i) => i % 2 === 0);
        const messageContents = allParts.filter((_, i) => i % 2 !== 0);
        this.streamBuffer = [];

        messageMarkers.forEach((marker, index) => {
            const decodedMarker = marker;
            const decodedContent = messageContents[index];
            if (this.relevancyTimeLimit) {
                // Log only relevant messages. Ignore too old log messages.
                const logTime = new Date(decodedMarker);
                if (logTime < this.relevancyTimeLimit) {
                    return;
                }
            }
            const message = decodedMarker + decodedContent;

            // Original log level information is not available. Log all on info level. Log level could be guessed for
            // some logs, but for any multiline logs such guess would be probably correct only for the first line.
            this.destinationLog.info(message.trim());
        });
    }
}

export interface StreamedLogOptions {
    /** Log client used to communicate with the Apify API. */
    logClient: LogClient;
    /** Log to which the Actor run logs will be redirected. */
    toLog: Log;
    /** Whether to redirect all logs from Actor run start (even logs from the past). */
    fromStart?: boolean;
}
