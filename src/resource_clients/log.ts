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

// Temp create it here and ask Martin where to put it

const DEFAULT_OPTIONS = {
    /** Whether to exclude timestamp of log redirection in redirected logs. */
    skipTime: true,
    /** Level of log redirection */
    level: LogLevel.DEBUG,
};

/**
 * Logger for redirected actor logs.
 */
export class LoggerActorRedirect extends Logger {
    constructor(options = {}) {
        super({ ...DEFAULT_OPTIONS, ...options });
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
    private toLog: Log;
    private streamBuffer: Buffer[] = [];
    private splitMarker = /(?:\n|^)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g;
    private relevancyTimeLimit: Date | null;

    private logClient: LogClient;
    private streamingTask: Promise<void> | null = null;
    private stopLogging = false;

    constructor(logClient: LogClient, toLog: Log, fromStart = true) {
        this.toLog = toLog;
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
            this.logBufferContent(false);

            // Keep processing the new data until stopped
            if (this.stopLogging) {
                break;
            }
        }

        // Process the remaining buffer
        this.logBufferContent(true);
    }

    /**
     * Parse the buffer and log complete messages.
     */
    private logBufferContent(includeLastPart = false): void {
        const allParts = Buffer.concat(this.streamBuffer).toString().split(this.splitMarker).slice(1);
        let messageMarkers;
        let messageContents;
        // Parse the buffer parts into complete messages
        if (includeLastPart) {
            // This is final call, so log everything. Do not keep anything in the buffer.
            messageMarkers = allParts.filter((_, i) => i % 2 === 0);
            messageContents = allParts.filter((_, i) => i % 2 !== 0);
            this.streamBuffer = [];
        } else {
            messageMarkers = allParts.filter((_, i) => i % 2 === 0).slice(0, -1);
            messageContents = allParts.filter((_, i) => i % 2 !== 0).slice(0, -1);

            // The last two parts (marker and message) are possibly not complete and will be left in the buffer.
            this.streamBuffer = [Buffer.from(allParts.slice(-2).join(''))];
        }

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
            this.toLog.info(message.trim());
        });
    }
}
