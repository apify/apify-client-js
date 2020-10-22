const ApifyClient = require('../src/index');

describe('ApifyClient', () => {
    test('default baseUrl is correctly set', () => {
        const client = new ApifyClient();
        expect(client.baseUrl).toBe('https://api.apify.com/v2');
    });
    test('baseUrl correctly strips trailing slash', () => {
        const exampleUrl = 'https://example.com';
        let client = new ApifyClient({ baseUrl: exampleUrl });
        expect(client.baseUrl).toBe(`${exampleUrl}/v2`);
        client = new ApifyClient({ baseUrl: `${exampleUrl}/` });
        expect(client.baseUrl).toBe(`${exampleUrl}/v2`);
    });
});
