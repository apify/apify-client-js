import type { AxiosInterceptorManager, AxiosRequestTransformer, AxiosResponse } from 'axios';
import axios, { AxiosHeaders } from 'axios';
import contentTypeParser from 'content-type';
import type { JsonObject } from 'type-fest';

import { maybeParseBody } from './body_parser.js';
import type { ApifyRequestConfig, ApifyResponse } from './http_client.js';
import { isCompressibleContentType, isNode, maybeCompressValue } from './utils.js';

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

    declare cause: Error;

    constructor(response: AxiosResponse, cause: Error) {
        super(`Response body could not be parsed.\nCause:${cause.message}`);
        this.name = this.constructor.name;
        this.code = 'invalid-response-body';
        this.response = response;
        this.cause = cause;
    }
}

/**
 * Reads a request header regardless of the casing it was set with, since HTTP header names are case-insensitive
 * while the config keeps whatever casing the caller used.
 */
function getHeader(config: ApifyRequestConfig, name: string): string | undefined {
    const wanted = name.toLowerCase();
    const key = Object.keys(config.headers ?? {}).find((candidate) => candidate.toLowerCase() === wanted);
    const value = key === undefined ? undefined : config.headers?.[key];

    return typeof value === 'string' ? value : undefined;
}

function serializeRequest(config: ApifyRequestConfig): ApifyRequestConfig {
    // A string body with an explicit content type is already serialized and goes out as it is. The axios default
    // transform would otherwise parse a JSON one in full just to check that it is valid, which for a body assembled
    // from thousands of pre-serialized requests costs about as much as serializing them did.
    const explicitContentType = config.headers?.['Content-Type'] || config.headers?.['content-type'];
    if (typeof config.data === 'string' && explicitContentType) return config;

    const [defaultTransform] = axios.defaults.transformRequest as AxiosRequestTransformer[];

    // The function not only serializes data, but it also adds correct headers.
    const data = (defaultTransform as any)(config.data, config.headers);

    // Actor inputs can include functions and we don't want to omit those,
    // because it's convenient for users. JSON.stringify removes them.
    // It's a bit inefficient that we serialize the JSON twice, but I feel
    // it's a small price to pay. The axios default transform does a lot
    // of body type checks and we would have to copy all of them to the resource clients.
    if (config.stringifyFunctions) {
        const contentTypeHeader = getHeader(config, 'content-type');
        try {
            const type = contentTypeHeader ? contentTypeParser.parse(contentTypeHeader).type : undefined;
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

function ensureHeadersPrototype(config: ApifyRequestConfig): ApifyRequestConfig {
    if (config.headers && !(config.headers instanceof AxiosHeaders)) {
        Object.setPrototypeOf(config.headers, AxiosHeaders.prototype);
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

async function maybeCompressRequest(config: ApifyRequestConfig): Promise<ApifyRequestConfig> {
    // A caller-supplied encoding means the body is already encoded and the header describes it, so leave both alone.
    if (getHeader(config, 'content-encoding')) return config;

    if (!isCompressibleContentType(getHeader(config, 'content-type'))) return config;

    const maybeCompressed = await maybeCompressValue(config.data);
    if (maybeCompressed) {
        config.headers ??= {};
        config.headers['content-encoding'] = maybeCompressed.encoding;
        config.data = maybeCompressed.data;
    }

    return config;
}

function parseResponseData(response: ApifyResponse): ApifyResponse {
    if (
        !response.data || // Nothing to do here.
        response.config.responseType !== 'arraybuffer' || // We don't want to parse custom response types.
        response.config.forceBuffer // Apify custom property to prevent parsing of buffer.
    ) {
        return response;
    }

    const isBufferEmpty = isNode() ? !response.data.length : !response.data.byteLength;
    if (isBufferEmpty) {
        // undefined is better than an empty buffer
        response.data = undefined;
        return response;
    }

    const contentTypeHeader = response.headers['content-type'] as string;
    try {
        response.data = maybeParseBody(response.data, contentTypeHeader);
    } catch (err) {
        throw new InvalidResponseBodyError(response, err as Error);
    }

    return response;
}

export type RequestInterceptorFunction = Parameters<AxiosInterceptorManager<ApifyRequestConfig>['use']>[0];
export type ResponseInterceptorFunction = Parameters<AxiosInterceptorManager<ApifyResponse>['use']>[0];

export const requestInterceptors: RequestInterceptorFunction[] = [
    maybeCompressRequest,
    serializeRequest,
    ensureHeadersPrototype,
];
export const responseInterceptors: ResponseInterceptorFunction[] = [parseResponseData];
