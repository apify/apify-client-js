const { ACT_JOB_TERMINAL_STATUSES } = require('apify-shared/consts');
const ApiClient = require('./api_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

/**
 * Resource client.
 *
 * @param {ApiClientOptions} options
 */
class ResourceClient extends ApiClient {
    /**
     * @return {Promise<?object>}
     * @private
     */
    async _get() {
        const requestOpts = {
            url: this._url(),
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
     * @return {Promise<object>}
     * @private
     */
    async _update(newFields) {
        const response = await this.httpClient.call({
            url: this._url(),
            method: 'PUT',
            params: this._params(),
            data: newFields,
        });
        return parseDateFields(pluckData(response.data));
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    async _delete() {
        try {
            await this.httpClient.call({
                url: this._url(),
                method: 'DELETE',
                params: this._params(),
            });
        } catch (err) {
            return catchNotFoundOrThrow(err);
        }
    }

    /**
     * This function is used in Build and Run endpoints so it's kept
     * here to stay DRY.
     *
     * @param {object} [options]
     * @param {number} [options.waitSecs]
     * @returns {Promise<object>}
     * @private
     */
    async _waitForFinish(options = {}) {
        const { waitSecs } = options;
        let job;

        const startedAt = Date.now();
        const shouldRepeat = () => {
            if (waitSecs && (Date.now() - startedAt) / 1000 >= waitSecs) return false;
            if (job && ACT_JOB_TERMINAL_STATUSES.includes(job.status)) return false;
            return true;
        };

        while (shouldRepeat()) {
            const waitForFinish = waitSecs
                ? Math.round(waitSecs - ((Date.now() - startedAt) / 1000))
                : 999999;

            const requestOpts = {
                url: this._url(),
                method: 'GET',
                params: this._params({ waitForFinish }),
            };
            try {
                const response = await this.httpClient.call(requestOpts);
                job = parseDateFields(pluckData(response.data));
            } catch (err) {
                job = catchNotFoundOrThrow(err);
            }

            // It might take some time for database replicas to get up-to-date,
            // so getRun() might return null. Wait a little bit and try it again.
            if (!job) await new Promise((resolve) => setTimeout(resolve, 250));
        }

        if (!job) {
            const jobName = this.constructor.name.match(/(\w+)Client/)[1].toLowerCase();
            throw new Error(`Waiting for ${jobName} to finish failed. Cannot fetch actor ${jobName} details from the server.`);
        }

        return job;
    }
}

module.exports = ResourceClient;
