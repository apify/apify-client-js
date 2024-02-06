const { Browser } = require('./_helper');
const { ApifyClient } = require('../src/index');

describe('ApifyApiError', () => {
    const browser = new Browser();

    beforeAll(async () => {
        await browser.start();
    });

    afterAll(async () => {
        await browser.cleanUpBrowser();
    });

    test('should carry all the information', async () => {
        const client = new ApifyClient();
        const actorCollectionClient = client.actors();
        const method = 'list';
        try {
            await actorCollectionClient[method]();
            throw new Error('wrong error');
        } catch (err) {
            expect(err.name).toEqual('ApifyApiError');
            // This does not work in v10 and lower, but we want to be able to run tests for v10,
            // because some people might still use it. They will just see clientMethod: undefined.
            if (!process.version.startsWith('v10')) {
                expect(err.clientMethod).toBe(`${actorCollectionClient.constructor.name}.${method}`);
            }
            expect(err.type).toEqual('token-not-provided');
            expect(err.message).toEqual('Authentication token was not provided');
            expect(err.statusCode).toEqual(401);
            expect(err.path).toMatch(`/v2/${actorCollectionClient.resourcePath}`);
            expect(err.httpMethod).toEqual('get');
            expect(err.attempt).toEqual(1);
        }
    });

    test('should carry all the information in browser', async () => {
        const page = await browser.getInjectedPage();
        const method = 'list';
        const error = await page.evaluate(async (m) => {
            const client = new window.Apify.ApifyClient();
            const actorCollectionClient = client.actors();
            try {
                await actorCollectionClient[m]();
                throw new Error('wrong error');
            } catch (err) {
                const serializableErr = {};
                Object.getOwnPropertyNames(err).forEach((prop) => {
                    serializableErr[prop] = err[prop];
                });
                serializableErr.resourcePath = actorCollectionClient.resourcePath;
                return serializableErr;
            }
        }, method);
        expect(error.name).toEqual('ApifyApiError');
        expect(error.clientMethod).toBe(`ActorCollectionClient.${method}`);
        expect(error.type).toEqual('token-not-provided');
        expect(error.message).toEqual('Authentication token was not provided');
        expect(error.statusCode).toEqual(401);
        expect(error.path).toMatch(`/v2/${error.resourcePath}`);
        expect(error.httpMethod).toEqual('get');
        expect(error.attempt).toEqual(1);
    });
});
