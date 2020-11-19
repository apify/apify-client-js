const ow = require('ow');
const ResourceClient = require('../base/resource_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

class RequestQueueClient extends ResourceClient {
    /**
     * @param {ApiClientOptions} options
     * @param {object} [userOptions]
     * @param {string} [userOptions.clientKey]
     */
    constructor(options, userOptions = {}) {
        super({
            resourcePath: 'request-queues',
            ...options,
        });
        this.clientKey = userOptions.clientKey;
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/get-request-queue
     * @return {Promise<RequestQueue>}
     */
    async get() {
        return this._get();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/update-request-queue
     * @param {object} newFields
     * @return {Promise<RequestQueue>}
     */
    async update(newFields) {
        ow(newFields, ow.object);
        return this._update(newFields);
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue/delete-request-queue
     * @return {Promise<void>}
     */
    async delete() {
        return this._delete();
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/queue-head/get-head
     * @param {object} [options]
     * @param {number} [options.limit]
     * @return {Promise<object>}
     */
    async listHead(options = {}) {
        ow(options, ow.object.exactShape({
            limit: ow.optional.number,
        }));
        const response = await this.httpClient.call({
            url: this._url('head'),
            method: 'GET',
            params: this._params({
                limit: options.limit,
                clientKey: this.clientKey,
            }),
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request-collection/add-request
     * @param {object} request
     * @param {object} [options]
     * @param {boolean} [options.forefront]
     * @return {Promise<object>}
     */
    async addRequest(request, options = {}) {
        ow(request, ow.object.partialShape({
            id: ow.undefined,
        }));
        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url('requests'),
            method: 'POST',
            data: request,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request/get-request
     * @param {string} id
     * @return {Promise<?object>}
     */
    async getRequest(id) {
        ow(id, ow.string);
        const requestOpts = {
            url: this._url(`requests/${id}`),
            method: 'GET',
            params: this._params(),
        };
        try {
            const response = await this.httpClient.call(requestOpts);
            return parseDateFields(pluckData(response.data));
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * https://docs.apify.com/api/v2#/reference/request-queues/request/update-request
     * @param {object} request
     * @param {object} [options]
     * @param {boolean} [options.forefront]
     * @return {Promise<*>}
     */
    async updateRequest(request, options = {}) {
        ow(request, ow.object.partialShape({
            id: ow.string,
        }));
        ow(options, ow.object.exactShape({
            forefront: ow.optional.boolean,
        }));

        const response = await this.httpClient.call({
            url: this._url(`requests/${request.id}`),
            method: 'PUT',
            data: request,
            params: this._params({
                forefront: options.forefront,
                clientKey: this.clientKey,
            }),
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * @param {string} id
     * @return {Promise<void>}
     */
    async deleteRequest(id) {
        ow(id, ow.string);
        await this.httpClient.call({
            url: this._url(`requests/${id}`),
            method: 'DELETE',
            params: this._params({
                clientKey: this.clientKey,
            }),
        });
    }
}

module.exports = RequestQueueClient;
