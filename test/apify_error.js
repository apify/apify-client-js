import { expect } from 'chai';
import ApifyClientError, { APIFY_ERROR_NAME } from '../build/apify_error';

describe('ApifyClientError', () => {
    it('should correctly handle all the information', () => {
        try {
            throw new ApifyClientError('SOME_CODE', 'Some message.', { foo: 'bar' });
        } catch (err) {
            expect(err.details).to.be.eql({ foo: 'bar' });
            expect(err.message).to.be.eql('Some message.');
            expect(err.type).to.be.eql('SOME_CODE');
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
        }
    });
});
