import { checkParamOrThrow, parseDateFields, pluckData } from './utils';
import Resource from './resource';

/**
 * Logs
 * @memberOf ApifyClient
 * @namespace logs
 */
export default class Log extends Resource {
    constructor(httpClient) {
        super(httpClient, '/v2/logs');
    }

    /**
     * @memberof ApifyClient.logs
     * @instance
     * @param {Object} options
     * @param {String} options.logId - ID of the log which is either ID of the act build or ID of the act run.
     * @returns {Promise.<string>|null}
     */
    async getLog(options = {}) {
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
