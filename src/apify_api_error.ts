import { AxiosResponse } from 'axios';
import { isomorphicBufferToString } from './body_parser';
import { isBuffer } from './utils';

/**
 * Examples of capturing groups for "...at ActorCollectionClient._list (/Users/..."
 * 0: "at ActorCollectionClient._list ("
 * 1: undefined
 * 2: "ActorCollectionClient"
 * 3: undefined
 * 4: "list"
 * @private
 */
const CLIENT_METHOD_REGEX = /at( async)? ([A-Za-z]+(Collection)?Client)\._?([A-Za-z]+) \(/;

/**
 * An `ApifyApiError` is thrown for successful HTTP requests that reach the API,
 * but the API responds with an error response. Typically, those are rate limit
 * errors and internal errors, which are automatically retried, or validation
 * errors, which are thrown immediately, because a correction by the user is
 * needed.
 * @hideconstructor
 */
export class ApifyApiError extends Error {
    override name: string;

    /**
     * The invoked resource client and the method. Known issue: Sometimes it displays
     * as `unknown` because it can't be parsed from a stack trace.
     */
    clientMethod: string;

    /**
     * HTTP status code of the error.
     */
    statusCode: number;

    /**
     * The type of the error, as returned by the API.
     */
    type?: string;

    /**
     * Number of the API call attempt.
     */
    attempt: number;

    /**
     * HTTP method of the API call.
     */
    httpMethod?: string;

    /**
     * Full path of the API endpoint (URL excluding origin).
     */
    path?: string;

    /**
     * Original stack trace of the exception. It is replaced
     * by a more informative stack with API call information.
     */
    originalStack: string;

    constructor(response: AxiosResponse, attempt: number) {
        let message!: string;
        let type: string | undefined;
        let responseData = response.data;

        // Some methods (e.g. downloadItems) set up forceBuffer on request response. If this request failed
        // the body buffer needs to parse to get the correct error.
        if (isBuffer(responseData)) {
            try {
                responseData = JSON.parse(isomorphicBufferToString(response.data, 'utf-8'));
            } catch (e) {
                // This can happen. The data in the response body are malformed.
            }
        }

        if (responseData && responseData.error) {
            const { error } = responseData;
            message = error.message;
            type = error.type;
        } else if (responseData) {
            let dataString;
            try {
                dataString = JSON.stringify(responseData, null, 2);
            } catch (err) {
                dataString = `${responseData}`;
            }
            message = `Unexpected error: ${dataString}`;
        }
        super(message);

        this.name = this.constructor.name;
        this.clientMethod = this._extractClientAndMethodFromStack();
        this.statusCode = response.status;
        this.type = type;
        this.attempt = attempt;
        this.httpMethod = response.config?.method;
        this.path = this._safelyParsePathFromResponse(response);

        const stack = this.stack!;

        this.originalStack = stack.slice(stack.indexOf('\n'));
        this.stack = this._createApiStack();
    }

    private _safelyParsePathFromResponse(response: AxiosResponse) {
        const urlString = response.config?.url;
        let url;
        try {
            url = new URL(urlString!);
        } catch {
            return urlString;
        }
        return url.pathname + url.search;
    }

    private _extractClientAndMethodFromStack() {
        const match = this.stack!.match(CLIENT_METHOD_REGEX);
        if (match) return `${match[2]}.${match[4]}`;
        return 'unknown';
    }

    /**
     * Creates a better looking and more informative stack that will be printed
     * out when API errors are thrown.
     *
     * Example:
     *
     * ApifyApiError: Actor task was not found
     *   clientMethod: TaskClient.start
     *   statusCode: 404
     *   type: record-not-found
     *   attempt: 1
     *   httpMethod: post
     *   path: /v2/actor-tasks/user~my-task/runs
     */
    private _createApiStack() {
        const {
            name,
            ...props
        } = this;

        const stack = Object.entries(props)
            .map(([k, v]) => {
                // Rename originalStack to stack in the stack itself.
                // This is for better readability of errors in log.
                if (k === 'originalStack') k = 'stack';
                return `  ${k}: ${v}`;
            })
            .join('\n');

        return `${name}: ${this.message}\n${stack}`;
    }
}
