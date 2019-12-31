import { checkParamOrThrow, parseDateFields, pluckData } from './utils';

/**
 * Logs
 * @memberOf ApifyClient
 * @namespace logs
 */
export default class Log {
    constructor(httpClient) {
        this.basePath = '/v2/logs';
        this.client = httpClient;
    }

    _call(userOptions, endpointOptions) {
        const callOptions = this._getCallOptions(userOptions, endpointOptions);
        return this.client.call(callOptions);
    }

    _getCallOptions(userOptions, endpointOptions) {
        const { baseUrl, token } = userOptions;
        const callOptions = {
            basePath: this.basePath,
            gzip: true,
            json: true,
            ...endpointOptions,
        };
        if (baseUrl) callOptions.baseUrl = baseUrl;
        if (token) callOptions.token = token;
        return callOptions;
    }

    /**
     * @memberof ApifyClient.logs
     * @instance
     * @param {Object} options
     * @param {String} options.logId - ID of the log which is either ID of the act build or ID of the act run.
     * @returns {Promise.<string>|null}
     */
    async getLog(options) {
        const { logId } = options;

        checkParamOrThrow(logId, 'logId', 'String');

        const endpointOptions = {
            url: `/${logId}`,
            method: 'GET',
        };

        const response = await this._call(options, endpointOptions);
        return parseDateFields(pluckData(response));
    }
}
