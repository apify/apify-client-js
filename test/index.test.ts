import { ApifyClient } from 'apify-client';
import { afterEach, describe, expect, test, vi } from 'vitest';

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
    test('token correctly set', () => {
        const token = 'myToken';
        const client = new ApifyClient({ token });
        expect(client.token).toBe(token);
    });

    describe('base URL environment variable resolution', () => {
        afterEach(() => {
            vi.unstubAllEnvs();
        });

        test('with no env vars and no options, baseUrl and publicBaseUrl resolve to the production default', () => {
            vi.stubEnv('APIFY_API_BASE_URL', undefined as unknown as string);
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', undefined as unknown as string);
            const client = new ApifyClient();
            expect(client.baseUrl).toBe('https://api.apify.com/v2');
            expect(client.publicBaseUrl).toBe('https://api.apify.com/v2');
        });

        test('APIFY_API_BASE_URL is used when no baseUrl option is given', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:8080');
            const client = new ApifyClient();
            expect(client.baseUrl).toBe('http://localhost:8080/v2');
        });

        test('APIFY_API_PUBLIC_BASE_URL is used when no publicBaseUrl option is given', () => {
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', 'http://localhost:8080');
            const client = new ApifyClient();
            expect(client.publicBaseUrl).toBe('http://localhost:8080/v2');
        });

        test('explicit baseUrl option wins over APIFY_API_BASE_URL', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:8080');
            const client = new ApifyClient({ baseUrl: 'http://example.test' });
            expect(client.baseUrl).toBe('http://example.test/v2');
        });

        test('explicit publicBaseUrl option wins over APIFY_API_PUBLIC_BASE_URL', () => {
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', 'http://localhost:8080');
            const client = new ApifyClient({ publicBaseUrl: 'http://example.test' });
            expect(client.publicBaseUrl).toBe('http://example.test/v2');
        });

        test('a custom port in APIFY_API_BASE_URL is honored with no special handling', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:9999');
            const client = new ApifyClient();
            expect(client.baseUrl).toBe('http://localhost:9999/v2');
        });

        test('APIFY_API_BASE_URL and APIFY_API_PUBLIC_BASE_URL are independent (only base set)', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:8080');
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', undefined as unknown as string);
            const client = new ApifyClient();
            expect(client.baseUrl).toBe('http://localhost:8080/v2');
            expect(client.publicBaseUrl).toBe('https://api.apify.com/v2');
        });

        test('APIFY_API_BASE_URL and APIFY_API_PUBLIC_BASE_URL are independent (only public set)', () => {
            vi.stubEnv('APIFY_API_BASE_URL', undefined as unknown as string);
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', 'http://localhost:8080');
            const client = new ApifyClient();
            expect(client.baseUrl).toBe('https://api.apify.com/v2');
            expect(client.publicBaseUrl).toBe('http://localhost:8080/v2');
        });

        test('the /v2 suffix is appended to env-supplied URLs', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:8080');
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', 'http://localhost:8080');
            const client = new ApifyClient();
            expect(client.baseUrl.endsWith('/v2')).toBe(true);
            expect(client.publicBaseUrl.endsWith('/v2')).toBe(true);
        });

        test('sub-clients inherit the resolved base URL and public base URL', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:8080');
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', 'http://localhost:9090');
            const client = new ApifyClient();
            const dataset = client.dataset('some-id');
            expect((dataset as unknown as { baseUrl: string }).baseUrl).toBe('http://localhost:8080/v2');
            expect((dataset as unknown as { publicBaseUrl: string }).publicBaseUrl).toBe('http://localhost:9090/v2');
        });

        test('a blank-but-defined APIFY_API_BASE_URL is treated as unset, not as an empty host', () => {
            vi.stubEnv('APIFY_API_BASE_URL', '');
            const client = new ApifyClient();
            expect(client.baseUrl).toBe('https://api.apify.com/v2');
        });

        test('a blank-but-defined APIFY_API_PUBLIC_BASE_URL is treated as unset, not as an empty host', () => {
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', '');
            const client = new ApifyClient();
            expect(client.publicBaseUrl).toBe('https://api.apify.com/v2');
        });
    });
});
