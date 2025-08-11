import type { Readable } from 'node:stream';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow } from '../utils';
import { Log, LogLevel} from "@apify/log";
//import logger from '@apify/log';

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
    async get(): Promise<string | undefined> {
        const requestOpts: ApifyRequestConfig = {
            url: this._url(),
            method: 'GET',
            params: this._params(),
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
    async stream(): Promise<Readable | undefined> {
        const params = {
            stream: true,
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

export class StreamedLog {
    protected toLogger: Log;
    protected streamBuffer: Buffer[] = [];
    protected splitMarker = /(?:\n|^)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g;
    protected relevancyTimeLimit: Date | null;

    constructor(toLogger: Log, fromStart: boolean = true) {
        this.toLogger = toLogger;
        this.relevancyTimeLimit = fromStart ? null : new Date();
    }

    protected processNewData(data: Buffer): void {
        this.streamBuffer.push(data);
        if (this.splitMarker.test(data.toString())) {
            this.logBufferContent(false);
        }
    }

    protected logBufferContent(includeLastPart: boolean = false): void {
        const allParts = Buffer.concat(this.streamBuffer).toString().split(this.splitMarker);
        const messageMarkers = includeLastPart ? allParts.filter((_, i) => i % 2 === 0) : allParts.slice(0, -2).filter((_, i) => i % 2 === 0);
        const messageContents = includeLastPart ? allParts.filter((_, i) => i % 2 !== 0) : allParts.slice(0, -2).filter((_, i) => i % 2 !== 0);

        this.streamBuffer = includeLastPart ? [] : [Buffer.from(allParts.slice(-2).join(''))];

        messageMarkers.forEach((marker, index) => {
            const decodedMarker = marker;
            const decodedContent = messageContents[index];
            if (this.relevancyTimeLimit) {
                const logTime = new Date(decodedMarker);
                if (logTime < this.relevancyTimeLimit) {
                    return;
                }
            }
            const message = decodedMarker + decodedContent;
            this.toLogger.internal(this.guessLogLevelFromMessage(message), message.trim());
        });
    }

    protected guessLogLevelFromMessage(message: string): LogLevel {
        // Original log level information does not have to be included in the message at all.
        // This is methods just guesses.
        if (message.includes("ERROR")) return LogLevel.ERROR
        if (message.includes("SOFT_FAIL")) return LogLevel.SOFT_FAIL;
        if (message.includes("WARNING")) return LogLevel.WARNING;
        if (message.includes("INFO")) return LogLevel.INFO;
        if (message.includes("DEBUG")) return LogLevel.DEBUG;
        if (message.includes("PERF")) return LogLevel.PERF;
        // Fallback in case original log message does not indicate known log level.
        return LogLevel.INFO;
    }
}

export class StreamedLogAsync extends StreamedLog{
    private logClient: { stream: (options: { raw: boolean }) => Promise<Readable | null> };
    private streamingTask: Promise<void> | null = null;
    private stopLogging = false;

    constructor(
        toLogger: Log,
        logClient: { stream: (options: { raw: boolean }) => Promise<Readable | null> },
        fromStart: boolean = true,
    ) {
        super(toLogger, fromStart);
        this.logClient = logClient;
        this.relevancyTimeLimit = fromStart ? null : new Date();
    }

    public async start(): Promise<void> {
        if (this.streamingTask) {
            throw new Error('Streaming task already active');
        }
        this.stopLogging = false;
        this.streamingTask = this._streamLog();
        return this.streamingTask;
    }

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

    public async withContext<T>(callback: () => Promise<T>): Promise<T> {
        await this.start();
        try {
            return await callback();
        } finally {
            await this.stop();
        }
    }

    private async _streamLog(): Promise<void> {
        const logStream = await this.logClient.stream({ raw: true });
        if (!logStream) {
            return;
        }

        for await (const chunk of logStream) {
            this._processNewData(chunk as Buffer);
            if (this.stopLogging) {
                break;
            }
        }

        // Process the remaining buffer
        this._logBufferContent(true);
    }

    private _processNewData(data: Buffer): void {
        this.streamBuffer.push(data);
        if (this.splitMarker.test(data.toString())) {
            this._logBufferContent(false);
        }
    }

    private _logBufferContent(includeLastPart: boolean): void {
        const allParts = Buffer.concat(this.streamBuffer).toString().split(this.splitMarker);
        const messageMarkers = includeLastPart ? allParts.filter((_, i) => i % 2 === 0) : allParts.slice(0, -2).filter((_, i) => i % 2 === 0);
        const messageContents = includeLastPart ? allParts.filter((_, i) => i % 2 !== 0) : allParts.slice(0, -2).filter((_, i) => i % 2 !== 0);

        this.streamBuffer = includeLastPart ? [] : [Buffer.from(allParts.slice(-2).join(''))];

        messageMarkers.forEach((marker, index) => {
            const decodedMarker = marker;
            const decodedContent = messageContents[index];
            if (this.relevancyTimeLimit) {
                const logTime = new Date(decodedMarker);
                if (logTime < this.relevancyTimeLimit) {
                    return;
                }
            }
            const message = decodedMarker + decodedContent;
            this.toLogger.internal(this.guessLogLevelFromMessage(message), message.trim());
        });
    }
}
