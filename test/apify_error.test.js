import ApifyClientError, { APIFY_ERROR_NAME } from '../build/apify_error';

describe('ApifyClientError', () => {
    test('should correctly handle all the information', () => {
        try {
            throw new ApifyClientError('SOME_CODE', 'Some message.', { foo: 'bar' });
        } catch (err) {
            expect(err.details).toEqual({ foo: 'bar' });
            expect(err.message).toEqual('Some message.');
            expect(err.type).toEqual('SOME_CODE');
            expect(err.name).toEqual(APIFY_ERROR_NAME);
        }
    });

    test('should return all info in toString()', () => {
        const err = new ApifyClientError('SOME_CODE', 'Some message.', { foo: 'bar', a: { b: 'c' } });

        expect(String(err)).toEqual(
            '[ApifyClientError] ApifyClientError: Some message. (foo="bar", a={"b":"c"})',
        );
    });
});
