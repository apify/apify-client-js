const ApifyApiError = require('../src/apify_api_error');

describe('ApifyApiError', () => {
    test('should carry all the information', () => {
        // Partial Axios response
        const response = {
            data: {
                error: {
                    type: 'test',
                    message: 'Test message',
                },
            },
            status: 500,
            config: {
                url: '/hello',
                method: 'post',
            },
        };
        try {
            throw new ApifyApiError(response, 2);
        } catch (err) {
            expect(err.name).toEqual('ApifyApiError');
            expect(err.type).toEqual('test');
            expect(err.message).toEqual('Test message');
            expect(err.statusCode).toEqual(500);
            expect(err.url).toEqual('/hello');
            expect(err.method).toEqual('post');
            expect(err.attempt).toEqual(2);
        }
    });
});
