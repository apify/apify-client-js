const ow = require('ow');
const { URL } = require('url');
const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
    stringifyWebhooksToBase64,
} = require('../utils');

class WebhookDispatchClient extends ResourceClient {
    /**
     * @param {object} options
     * @param {string} options.id
     * @param {string} options.baseUrl
     * @param {HttpClient} options.httpClient
     * @param {object} [options.params]
     */
    constructor(options) {
        super({
            resourcePath: 'webhook-dispatches',
            disableMethods: ['update', 'delete'],
            ...options,
        });
    }
}

module.exports = WebhookDispatchClient;
