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
import { RunClient } from "./run";
import { Log } from "@apify/log";

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

    _console_log(line: string) {
        console.log(line); // eslint-disable-line no-console
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
        this._console_log(line);
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
    public async start(): Promise<void> {
        if (this.streamingTask) {
            throw new Error('Streaming task already active');
        }
        this.stopLogging = false;
        this.streamingTask = this.streamLog();
        return this.streamingTask;
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
        const twoBytesLimit = 0xc0;
        const threeBytesLimit = 0xe0;
        const fourBytesLimit = 0xf0;

        const logStream = await this.logClient.stream({ raw: true });
        if (!logStream) {
            return;
        }
        let incompleteCharacter: Uint8Array = new Uint8Array();

        for await (const chunk of logStream) {
            // Handle possible leftover incomplete multibyte character from previous chunk
            const chunkPrependedWithIncompleteCharacter = new Uint8Array(incompleteCharacter.length + chunk.length);
            chunkPrependedWithIncompleteCharacter.set(incompleteCharacter, 0);
            chunkPrependedWithIncompleteCharacter.set(chunk, incompleteCharacter.length);

            // Extract possible incomplete multibyte character from the end of this chunk
            if (
                chunkPrependedWithIncompleteCharacter.length > 1 &&
                chunkPrependedWithIncompleteCharacter[chunkPrependedWithIncompleteCharacter.length] >= twoBytesLimit
            ) {
                incompleteCharacter = chunkPrependedWithIncompleteCharacter.slice(
                    chunkPrependedWithIncompleteCharacter.length - 1,
                );
            } else if (
                chunkPrependedWithIncompleteCharacter.length > 2 &&
                chunkPrependedWithIncompleteCharacter[chunkPrependedWithIncompleteCharacter.length] >= threeBytesLimit
            ) {
                incompleteCharacter = chunkPrependedWithIncompleteCharacter.slice(
                    chunkPrependedWithIncompleteCharacter.length - 2,
                );
            } else if (
                chunkPrependedWithIncompleteCharacter.length > 3 &&
                chunkPrependedWithIncompleteCharacter[chunkPrependedWithIncompleteCharacter.length] >= fourBytesLimit
            ) {
                incompleteCharacter = chunkPrependedWithIncompleteCharacter.slice(
                    chunkPrependedWithIncompleteCharacter.length - 3,
                );
            }

            // Keep processing the new data until stopped
            this.streamBuffer.push(Buffer.from(chunkPrependedWithIncompleteCharacter));
            // Log data only if the chunk contains the marker as it indicates previous message is complete
            if (this.splitMarker.test(chunkPrependedWithIncompleteCharacter.toString())) {
                this.logBufferContent(false);
            }
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

            // Log parsed message at guessed level.
            this.logAtGuessedLevel(message);
        });
    }

    /**
     * Log messages at appropriate log level guessed from the message content.
     *
     * Original log level information does not have to be included in the message at all.
     * This is methods just guesses, exotic formating or specific keywords can break the guessing logic.
     */
    private logAtGuessedLevel(message: string) {
        message = message.trim();

        if (message.includes('ERROR')) this.toLog.error(message);
        else if (message.includes('SOFT_FAIL')) this.toLog.softFail(message);
        else if (message.includes('WARNING')) this.toLog.warning(message);
        else if (message.includes('INFO')) this.toLog.info(message);
        else if (message.includes('DEBUG')) this.toLog.debug(message);
        else if (message.includes('PERF')) this.toLog.perf(message);
        // Fallback in case original log message does not indicate known log level.
        else this.toLog.info(message);
    }
}


class StatusMessageWatcher {
    private static finalSleepTimeMs = 6000;

    protected toLog: Log;
    protected checkPeriod: number;
    protected lastStatusMessage = '';
    private runClient: RunClient;
    private loggingTask: Promise<void> | null = null;
    private stopped = false;

    constructor(toLog: Log,runClient: RunClient, checkPeriod = 5000) {
        this.runClient = runClient
        this.toLog = toLog;
        this.checkPeriod = checkPeriod;

    }

    async start(): Promise<void> {
        if (this.loggingTask) {
            throw new Error('Logging task already active');
        }
        this.stopped = false;
        this.loggingTask = this._logChangedStatusMessage();
        return this.loggingTask;
    }

    async stop(): Promise<void> {
        if (!this.loggingTask) {
            throw new Error('Logging task is not active');
        }
        await new Promise(resolve => {setTimeout(resolve, StatusMessageWatcher.finalSleepTimeMs)});
        this.stopped = true;
        await this.loggingTask;
        this.loggingTask = null;
    }

    async _logChangedStatusMessage(): Promise<void> {
        while (!this.stopped) {
            const runData = await this.runClient.get();
            if (runData !== undefined) {
                const status = runData.status ?? 'Unknown status';
                const statusMessage = runData.statusMessage ?? '';
                const newStatusMessage = `Status: ${status}, Message: ${statusMessage}`;
                if (newStatusMessage !== this.lastStatusMessage) {
                    this.lastStatusMessage = newStatusMessage;
                    this.toLog.info(newStatusMessage);
                }
                await new Promise(resolve => {setTimeout(resolve, this.checkPeriod)});
            }
        }
    }
}
