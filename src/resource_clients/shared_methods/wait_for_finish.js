const { ACT_JOB_TERMINAL_STATUSES } = require('apify-shared/consts');
const { parseDateFields, pluckData, catchNotFoundOrThrow } = require('../../utils');
/**
 * This function is used in Build and Run endpoints so it's kept
 * here to stay DRY.
 *
 * Note: The function relies on 'this' being bound correctly once
 * attached to the respective clients.
 *
 * @param {object} [options]
 * @param {number} [options.waitSecs]
 * @returns {Promise<Run>}
 * @private
 */
exports.waitForFinish = async function (options = {}) {
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
};
