const { ACT_JOB_TERMINAL_STATUSES } = require('@apify/consts');
const ApiClient = require('./api_client');
const {
    pluckData,
    parseDateFields,
    catchNotFoundOrThrow,
} = require('../utils');

/**
 * We need to supply some number for the API,
 * because it would not accept "Infinity".
 * 999999 seconds is more than 10 days.
 * @type {number}
 */
const MAX_WAIT_FOR_FINISH = 999999;

/**
 * Resource client.
 *
 * @param {ApiClientOptions} options
 * @private
 */
class ResourceClient extends ApiClient {
    /**
     * @param {object} [options]
     * @return {Promise<?object>}
     * @private
     */
    async _get(options = {}) {
        const requestOpts = {
            url: this._url(),
            method: 'GET',
            params: { ...options },
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
        const {
            waitSecs = MAX_WAIT_FOR_FINISH,
        } = options;
        const waitMillis = waitSecs * 1000;
        let job;

        const startedAt = Date.now();
        const shouldRepeat = () => {
            const millisSinceStart = Date.now() - startedAt;
            if (millisSinceStart >= waitMillis) return false;
            const hasJobEnded = job && ACT_JOB_TERMINAL_STATUSES.includes(job.status);
            return !hasJobEnded;
        };

        do {
            const millisSinceStart = Date.now() - startedAt;
            const remainingWaitSeconds = Math.round((waitMillis - millisSinceStart) / 1000);
            const waitForFinish = Math.max(0, remainingWaitSeconds);

            const requestOpts = {
                url: this._url(),
                method: 'GET',
                params: { waitForFinish },
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
        } while ((shouldRepeat()));

        if (!job) {
            const jobName = this.constructor.name.match(/(\w+)Client/)[1].toLowerCase();
            throw new Error(`Waiting for ${jobName} to finish failed. Cannot fetch actor ${jobName} details from the server.`);
        }

        return job;
    }
}

module.exports = ResourceClient;
