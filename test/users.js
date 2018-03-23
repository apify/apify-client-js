import { ME_USER_NAME_PLACEHOLDER } from 'apify-shared/consts';
import { expect } from 'chai';
import ApifyClient from '../build';
import { BASE_PATH } from '../build/users';
import { mockRequest, requestExpectCall, restoreRequest } from './_helper';

const BASE_URL = 'http://example.com/something';
const OPTIONS = { baseUrl: BASE_URL };

describe('Users', () => {
    before(mockRequest);
    after(restoreRequest);

    it('getUser() works', () => {
        const userId = 'my-user-id';
        const expected = {
            username: 'myuser',
            profile: {},
        };

        requestExpectCall({
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${userId}`,
            json: true,
        }, { data: expected });

        const apifyClient = new ApifyClient(OPTIONS);

        return apifyClient
            .users
            .getUser({ userId })
            .then(given => expect(given).to.be.eql(expected));
    });


    it('getAccount() works', () => {
        const token = 'my-token';
        const expected = {
            id: 'my-user-id',
            username: 'myuser',
            profile: {},
            limits: {},
            proxy: {},
            currentBillingPeriod: {},
        };

        requestExpectCall({
            method: 'GET',
            url: `${BASE_URL}${BASE_PATH}/${ME_USER_NAME_PLACEHOLDER}`,
            json: true,
            qs: { token },
        }, { data: expected });

        const apifyClient = new ApifyClient(Object.assign(OPTIONS, { token }));

        return apifyClient
            .users
            .getAccount()
            .then(given => expect(given).to.be.eql(expected));
    });
});
