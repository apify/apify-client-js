const ApifyClient = require('../src/index');

describe('ApifyApiError', () => {
    test('should carry all the information', async () => {
        const client = new ApifyClient();
        const actorCollectionClient = client.actors();
        const method = 'list';
        try {
            await actorCollectionClient[method]();
        } catch (err) {
            expect(err.name).toEqual('ApifyApiError');
            expect(err.clientMethod).toBe(`${actorCollectionClient.constructor.name}.${method}`);
            expect(err.type).toEqual('token-not-provided');
            expect(err.message).toEqual('Authentication token was not provided');
            expect(err.statusCode).toEqual(401);
            expect(err.path).toMatch(`/v2/${actorCollectionClient.resourcePath}`);
            expect(err.httpMethod).toEqual('get');
            expect(err.attempt).toEqual(1);
        }
    });
});
