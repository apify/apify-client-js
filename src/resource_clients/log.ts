import type { Readable } from 'node:stream';

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
