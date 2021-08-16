import ow from 'ow';

export class Statistics {
    /**
     * Number of Apify client function calls
     */
    calls = 0;

    /**
     * Number of Apify API requests
     */
    requests = 0;

    /**
     * Number of times the API returned 429 error. Errors on first attempt are
     * counted at index 0. First retry error counts are on index 1 and so on.
     */
    rateLimitErrors: number[] = [];

    addRateLimitError(attempt: number): void {
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
     */
    private _fillBlanksWithZeroes(inclusiveIndex: number) {
        if (this.rateLimitErrors.length <= inclusiveIndex) {
            for (let k = 0; k <= inclusiveIndex; k++) {
                if (typeof this.rateLimitErrors[k] !== 'number') {
                    this.rateLimitErrors[k] = 0;
                }
            }
        }
    }
}
