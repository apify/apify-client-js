import { ApifyClient, AxiosHttpClient } from 'apify-client';
import { describe, expect, test } from 'vitest';

describe('ApifyClient', () => {
    test('default baseUrl is correctly set', () => {
        const client = new ApifyClient();
        expect(client.baseUrl).toBe('https://api.apify.com/v2');
    });
    test.each([
        { input: 'https://example.com', expected: 'https://example.com/v2' },
        { input: 'https://example.com/', expected: 'https://example.com/v2' },
        { input: 'https://example.com/v2', expected: 'https://example.com/v2' },
        { input: 'https://example.com/v2/', expected: 'https://example.com/v2' },
        { input: 'https://example.com/v2//', expected: 'https://example.com/v2' },
        { input: 'https://example.com/proxy/v2', expected: 'https://example.com/proxy/v2' },
        { input: 'https://example.com/apiv2', expected: 'https://example.com/apiv2/v2' },
        { input: 'https://v2', expected: 'https://v2/v2' },
    ])('baseUrl and publicBaseUrl $input resolve to $expected', ({ input, expected }) => {
        const client = new ApifyClient({ baseUrl: input, publicBaseUrl: input });
        expect(client.baseUrl).toBe(expected);
        expect(client.publicBaseUrl).toBe(expected);
    });
    test('withCustomHttpClient accepts baseUrl with the API version', () => {
        const client = ApifyClient.withCustomHttpClient({
            baseUrl: 'https://example.com/v2',
            httpClient: new AxiosHttpClient(),
        });
        expect(client.baseUrl).toBe('https://example.com/v2');
    });
    test('token correctly set', () => {
        const token = 'myToken';
        const client = new ApifyClient({ token });
        expect(client.token).toBe(token);
    });
});
