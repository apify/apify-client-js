/**
 * @typedef ApiClientOptions
 * @property {object} options
 * @property {string} options.baseUrl
 * @property {string} options.resourcePath
 * @property {ApifyClient} options.apifyClient
 * @property {HttpClient} options.httpClient
 * @property {string} [options.id]
 * @private
 */

/**
 * @private
 */
class ApiClient {
    /**
     * @param {ApiClientOptions} options
     */
    constructor(options) {
        const {
            baseUrl,
            apifyClient,
            httpClient,
            resourcePath,
            id,
        } = options;

        this.id = id;
        this.safeId = id && this._toSafeId(id);
        this.baseUrl = baseUrl;
        this.resourcePath = resourcePath;
        this.url = id
            ? `${baseUrl}/${resourcePath}/${this.safeId}`
            : `${baseUrl}/${resourcePath}`;
        this.apifyClient = apifyClient;
        this.httpClient = httpClient;
    }

    /**
     * @param {object} [moreOptions]
     * @return object
     * @private
     */
    _subResourceOptions(moreOptions) {
        const baseOptions = {
            baseUrl: this._url(),
            apifyClient: this.apifyClient,
            httpClient: this.httpClient,
        };
        return { ...baseOptions, ...moreOptions };
    }

    /**
     * @param {string} [path]
     * @returns {string}
     * @private
     */
    _url(path) {
        return path ? `${this.url}/${path}` : this.url;
    }

    /**
     * @param {string} id
     * @return {string}
     * @private
     */
    _toSafeId(id) {
        return id.replace('/', '~');
    }
}

module.exports = ApiClient;
