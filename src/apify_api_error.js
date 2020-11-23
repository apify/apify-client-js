/**
 * Examples of capturing groups for "...at ActorCollectionClient._list (/Users/..."
 * 0: "at ActorCollectionClient._list ("
 * 1: undefined
 * 2: "ActorCollectionClient"
 * 3: undefined
 * 4: "list"
 * @type {RegExp}
 * @private
 */
const CLIENT_METHOD_REGEX = /at( async)? ([A-Za-z]+(Collection)?Client)\._?([A-Za-z]+) \(/;

/**
 * Apify API error
 * @property {string} message
 * @hideconstructor
 */
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
        } else if (response.data) {
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
     *   path: /v2/actor-tasks/user~my-task/runs
     *
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
                // Keep function call stack only as a property.
                // It's not useful for users.
                if (k === 'originalStack') return '';
                return `  ${k}: ${v}`;
            })
            .join('\n');

        return `${name}: ${this.message}\n${stack}`;
    }
}

module.exports = ApifyApiError;
