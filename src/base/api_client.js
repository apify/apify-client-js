/**
 * @typedef ApiClientOptions
 * @property {object} options
 * @property {string} options.baseUrl
 * @property {string} options.resourcePath
 * @property {HttpClient} options.httpClient
 * @property {string[]} [options.disableMethods]
 * @property {string} [options.id]
 * @property {object} [options.params]
 */

/**
 * API client.
 */
class ApiClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        const {
            baseUrl,
            httpClient,
            resourcePath,
            disableMethods = [],
            id,
            params = {},
        } = options;

        this.id = id;
        this.safeId = id && this._toSafeId(id);
        this.baseUrl = baseUrl;
        this.resourcePath = resourcePath;
        this.url = id
            ? `${baseUrl}/${resourcePath}/${this.safeId}`
            : `${baseUrl}/${resourcePath}`;
        this.httpClient = httpClient;
        this.params = params;
        this.disabledMethods = disableMethods.map((m) => m.toLowerCase());
    }

    /**
     * @property {object} [moreOptions]
     * @return object
     */
    _subResourceOptions(moreOptions) {
        const baseOptions = {
            baseUrl: this._url(),
            httpClient: this.httpClient,
            params: this._params(),
        };
        return { ...baseOptions, ...moreOptions };
    }

    /**
     * @property {string} methodName
     */
    _throwIfDisabled(methodName) {
        if (this.disabledMethods.includes(methodName.toLowerCase())) {
            throw new Error(`${this.constructor.name} does not support method: ${methodName}`);
        }
    }

    /**
     * @property {string} [path]
     * @returns {string}
     */
    _url(path) {
        return path ? `${this.url}/${path}` : this.url;
    }

    /**
     * @property {object} [endpointParams]
     * @returns {object}
     */
    _params(endpointParams) {
        return { ...this.params, ...endpointParams };
    }

    _toSafeId(id) {
        return id.replace('/', '~');
    }
}

module.exports = ApiClient;
