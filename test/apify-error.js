import { expect } from 'chai';
import ApifyError, { APIFY_ERROR_NAME } from '../build/apify-error';

describe('ApifyError', () => {
    it('should correctly handle all the informations', () => {
        try {
            throw new ApifyError('SOME_CODE', 'Some message.', { foo: 'bar' });
        } catch (err) {
            expect(err.details).to.be.eql({ foo: 'bar' });
            expect(err.message).to.be.eql('Some message.');
            expect(err.type).to.be.eql('SOME_CODE');
            expect(err.name).to.be.eql(APIFY_ERROR_NAME);
        }
    });
});
