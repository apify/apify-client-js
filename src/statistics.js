const ow = require('ow').default;

class Statistics {
    constructor() {
        /**
         * Number of Apify client function calls
         * @type {number}
         */
        this.calls = 0;
        /**
         * Number of Apify API requests
         * @type {number}
         */
        this.requests = 0;
        /**
         * Number of times the API returned 429 error. Errors on first attempt are
         * counted at index 0. First retry error counts are on index 1 and so on.
         * @type {number[]}
         */
        this.rateLimitErrors = [];
    }

    addRateLimitError(attempt) {
        ow(attempt, ow.number.greaterThan(0));
        // attempt is never 0,
        // but we don't want index 0 empty
        const index = attempt - 1;
        this._fillBlanksWithZeroes(index);
        this.rateLimitErrors[index]++;
    }

    /**
     * Removes the necessity to pre-initialize array with correct
     * number of zeroes by dynamically filling the empty indexes
     * when necessary.
     *
     * @param inclusiveIndex
     * @private
     */
    _fillBlanksWithZeroes(inclusiveIndex) {
        if (this.rateLimitErrors.length <= inclusiveIndex) {
            for (let k = 0; k <= inclusiveIndex; k++) {
                if (typeof this.rateLimitErrors[k] !== 'number') {
                    this.rateLimitErrors[k] = 0;
                }
            }
        }
    }
}

module.exports = Statistics;
