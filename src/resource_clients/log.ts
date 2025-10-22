import type { Readable } from 'node:stream';
import c from 'ansi-colors';

import type { ApifyApiError } from '../apify_api_error';
import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';
import type { ApifyRequestConfig } from '../http_client';
import { cast, catchNotFoundOrThrow } from '../utils';
import type { Log} from "@apify/log";
import { Logger, LogLevel } from "@apify/log";

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
    async get(options = {raw:false}): Promise<string | undefined> {
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
    async stream(options = {raw:false}): Promise<Readable | undefined> {
        const params = {
            stream: true,
            raw: options.raw
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


// Temp create it here and ask Martin where to put it

const DEFAULT_OPTIONS = {
    skipTime: true,
    level: LogLevel.DEBUG,
};

export class LoggerActorRedirect extends Logger {
    constructor(options = {}) {
        super({ ...DEFAULT_OPTIONS, ...options });
    }

    _console_log(line:string){
        console.log(line)
    }

    override _log(level: LogLevel, message: string, data?: any, exception?: unknown, opts: Record<string, any> = {}) {
        if (level > this.options.level) {
            return;
        }
        if (data || exception){
            throw new Error("Redirect logger does not use other arguments than level and message");
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


export class StreamedLog {
    private toLog: Log;
    private streamBuffer: Buffer[] = [];
    private splitMarker = /(?:\n|^)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g;
    private relevancyTimeLimit: Date | null;

    private logClient: { stream: (options: { raw: boolean }) => Promise<Readable | undefined> };
    private streamingTask: Promise<void> | null = null;
    private stopLogging = false;

    constructor(
        logClient: { stream: (options: { raw: boolean }) => Promise<Readable | undefined> },
        toLog: Log,
        fromStart = true,
    ) {
        this.toLog = toLog;
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

    public async with<T>(callback: () => Promise<T>): Promise<T> {
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
        this.logBufferContent(true);
    }

    private _processNewData(data: Buffer): void {
        this.streamBuffer.push(data);
        if (this.splitMarker.test(data.toString())) {
            this.logBufferContent(false);
        }
    }

    private logBufferContent(includeLastPart = false): void {
        const allParts = Buffer.concat(this.streamBuffer).toString().split(this.splitMarker).slice(1);
        let messageMarkers;
        let messageContents;
        if (includeLastPart) {
            messageMarkers = allParts.filter((_, i) => i % 2 === 0);
            messageContents = allParts.filter((_, i) => i % 2 !== 0);
            this.streamBuffer = [];
        } else {
            messageMarkers = allParts.filter((_, i) => i % 2 === 0).slice(0, -1);
            messageContents = allParts.filter((_, i) => i % 2 !== 0).slice(0, -1);

            // The last two parts (marker and message) are possibly not complete and will be left in the buffer
            this.streamBuffer = [Buffer.from(allParts.slice(-2).join(''))];
        }

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
            this.logAtGuessedLevel(message);
        });
    }

    private logAtGuessedLevel(message: string) {
        // Original log level information does not have to be included in the message at all.
        // This is methods just guesses, exotic formating or specific keywords can break the guessing logic.

        message = message.trim();

        // TODO: Guessing can use the coloring symbols

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
