/**
 * Examples of capturing groups for "...at ActorCollectionClient._list (/Users/..."
 * 0: "at ActorCollectionClient._list ("
 * 1: undefined
 * 2: "ActorCollectionClient"
 * 3: undefined
 * 4: "list"
 * @type {RegExp}
 */
const CLIENT_METHOD_REGEX = /at( async)? ([A-Za-z]+(Collection)?Client)\._?([A-Za-z]+) \(/;

class ApifyApiError extends Error {
    /**
     * @param {AxiosResponse} response
     * @param {number} attempt
     */
    constructor(response, attempt) {
        let message;
        let type;
        if (response.data && response.data.error) {
            const { error } = response.data;
            message = error.message;
            type = error.type;
        } else {
            let dataString;
            try {
                dataString = JSON.stringify(response.data, null, 2);
            } catch (err) {
                dataString = `${response.data}`;
            }
            message = `Unexpected error: ${dataString}`;
        }
        super(message);

        this.name = this.constructor.name;
        this.clientMethod = this._extractClientAndMethodFromStack();
        this.statusCode = response.status;
        this.type = type;
        this.attempt = attempt;
        this.httpMethod = response.config && response.config.method;
        this.path = this._safelyParsePathFromResponse(response);

        this.originalStack = this.stack.slice(this.stack.indexOf('\n'));
        this.stack = this._createApiStack();
    }

    /**
     * @param {AxiosResponse} response
     * @return {string}
     * @private
     */
    _safelyParsePathFromResponse(response) {
        const urlString = response.config && response.config.url;
        let url;
        try {
            url = new URL(urlString);
        } catch (err) {
            return urlString;
        }
        return url.pathname + url.search;
    }

    /**
     * @return {string}
     * @private
     */
    _extractClientAndMethodFromStack() {
        const match = this.stack.match(CLIENT_METHOD_REGEX);
        if (match) return `${match[2]}.${match[4]}`;
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
     *   path: /v2/actor-tasks/mnmkng~my-task-3333/runs
     *   stack:
     *     at makeRequest (/usr/src/app/node_modules/apify-client/src/http-client.js:112:22)
     *     at processTicksAndRejections (internal/process/task_queues.js:97:5)
     *     at async TaskClient.start (/usr/src/app/node_modules/apify-client/src/resource_clients/task.js:59:26)
     *     at async TaskClient.call (/usr/src/app/node_modules/apify-client/src/resource_clients/task.js:85:31)
     *     at async /usr/src/app/main.js:5:17
     *     at async run (/usr/src/app/node_modules/apify/build/actor.js:181:13)
     * @return {string}
     * @private
     */
    _createApiStack() {
        const {
            name,
            ...props
        } = this;
        const stack = Object.entries(props)
            .map(([k, v]) => {
                // Rename internal callStack to stack in the stack itself.
                // This is for better readability.
                if (k === 'originalStack') k = 'stack';
                return `  ${k}: ${v}`;
            })
            .join('\n');

        return `${name}: ${this.message}\n${stack}`;
    }
}

module.exports = ApifyApiError;
