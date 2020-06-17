
class ApiClient {
    /**
     * @param {object} options
     * @param {string} options.baseUrl
     * @param {string} options.resourcePath
     * @param {HttpClient} options.httpClient
     * @param {string[]} [options.disableMethods]
     * @param {object} [options.id]
     * @param {object} [options.params]
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
     * @param {object} [moreOptions]
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
     * @param {string} methodName
     */
    _throwIfDisabled(methodName) {
        if (this.disabledMethods.includes(methodName.toLowerCase())) {
            throw new Error(`${this.constructor.name} does not support method: ${methodName}`);
        }
    }

    /**
     * @param {string} [path]
     * @returns {string}
     */
    _url(path) {
        return path ? `${this.url}/${path}` : this.url;
    }

    /**
     * @param {object} [endpointParams]
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
