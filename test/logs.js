import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/logs';
import { mockRequest, requestExpectCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Logs', () => {
    before(mockRequest);
    after(restoreRequest);

    it('getLog() works', () => {
        const logId = 'some-id';
        const expected = 'line \n line \n line;';

        requestExpectCall({
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${logId}`,
            gzip: true,
        }, expected);

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .logs
            .getLog({ logId })
            .then(given => expect(given).to.be.eql(expected));
    });
});
