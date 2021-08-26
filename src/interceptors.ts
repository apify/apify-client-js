import axios, { AxiosInterceptorManager, AxiosResponse, AxiosTransformer } from 'axios';
import contentTypeParser from 'content-type';
import { JsonObject } from 'type-fest';
import { maybeParseBody } from './body_parser';
import { ApifyRequestConfig, ApifyResponse } from './http_client';
import {
    isNode,
    maybeGzipValue,
} from './utils';

/**
 * This error exists for the quite common situation, where only a partial JSON response is received and
 * an attempt to parse the JSON throws an error. In most cases this can be resolved by retrying the
 * request. We do that by identifying this error in HttpClient.
 *
 * The properties mimic AxiosError for easier integration in HttpClient error handling.
 */
export class InvalidResponseBodyError extends Error {
    code: string;

    response: AxiosResponse;

    cause: Error;

    constructor(response: AxiosResponse, cause: Error) {
        super(`Response body could not be parsed.\nCause:${cause.message}`);
        this.name = this.constructor.name;
        this.code = 'invalid-response-body';
        this.response = response;
        this.cause = cause;
    }
}

function serializeRequest(config: ApifyRequestConfig): ApifyRequestConfig {
    const [defaultTransform] = axios.defaults.transformRequest as AxiosTransformer[];

    // The function not only serializes data, but it also adds correct headers.
    const data = defaultTransform(config.data, config.headers);

    // Actor inputs can include functions and we don't want to omit those,
    // because it's convenient for users. JSON.stringify removes them.
    // It's a bit inefficient that we serialize the JSON twice, but I feel
    // it's a small price to pay. The axios default transform does a lot
    // of body type checks and we would have to copy all of them to the resource clients.
    if (config.stringifyFunctions) {
        const contentTypeHeader = config.headers['Content-Type'] || config.headers['content-type'];
        try {
            const { type } = contentTypeParser.parse(contentTypeHeader);
            if (type === 'application/json' && typeof config.data === 'object') {
                config.data = stringifyWithFunctions(config.data);
            } else {
                config.data = data;
            }
        } catch {
            config.data = data;
        }
    } else {
        config.data = data;
    }

    return config;
}

/**
 * JSON.stringify() that serializes functions to string instead
 * of replacing them with null or removing them.
 */
function stringifyWithFunctions(obj: JsonObject) {
    return JSON.stringify(obj, (_key, value) => {
        return typeof value === 'function' ? value.toString() : value;
    });
}

async function maybeGzipRequest(config: ApifyRequestConfig): Promise<ApifyRequestConfig> {
    if (config.headers['content-encoding']) return config;

    const maybeZippedData = await maybeGzipValue(config.data);
    if (maybeZippedData) {
        config.headers['content-encoding'] = 'gzip';
        config.data = maybeZippedData;
    }

    return config;
}

function parseResponseData(response: ApifyResponse): ApifyResponse {
    if (
        !response.data // Nothing to do here.
        || response.config.responseType !== 'arraybuffer' // We don't want to parse custom response types.
        || response.config.forceBuffer // Apify custom property to prevent parsing of buffer.
    ) {
        return response;
    }

    const isBufferEmpty = isNode() ? !response.data.length : !response.data.byteLength;
    if (isBufferEmpty) {
        // undefined is better than an empty buffer
        response.data = undefined;
        return response;
    }

    const contentTypeHeader = response.headers['content-type'];
    try {
        response.data = maybeParseBody(response.data, contentTypeHeader);
    } catch (err) {
        throw new InvalidResponseBodyError(response, err as Error);
    }

    return response;
}

export type RequestInterceptorFunction = Parameters<AxiosInterceptorManager<ApifyRequestConfig>['use']>[0];
export type ResponseInterceptorFunction = Parameters<AxiosInterceptorManager<ApifyResponse>['use']>[0];

export const requestInterceptors: RequestInterceptorFunction[] = [maybeGzipRequest, serializeRequest];
export const responseInterceptors: ResponseInterceptorFunction[] = [parseResponseData];
