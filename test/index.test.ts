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

        // Stubs an env var, or clears it when the value is undefined.
        const stubEnv = (name: string, value: string | undefined) => {
            vi.stubEnv(name, value as unknown as string);
        };

        describe('baseUrl (APIFY_API_BASE_URL)', () => {
            test.each([
                { case: 'defaults to production when unset', env: undefined, option: undefined, expected: 'https://api.apify.com/v2' },
                { case: 'uses the env var when no option is given', env: 'http://localhost:8080', option: undefined, expected: 'http://localhost:8080/v2' },
                { case: 'explicit option wins over the env var', env: 'http://localhost:8080', option: 'http://example.test', expected: 'http://example.test/v2' },
                { case: 'honors a custom port with no special handling', env: 'http://localhost:9999', option: undefined, expected: 'http://localhost:9999/v2' },
                { case: 'treats a blank-but-defined value as unset', env: '', option: undefined, expected: 'https://api.apify.com/v2' },
            ])('$case', ({ env, option, expected }) => {
                stubEnv('APIFY_API_BASE_URL', env);
                const client = new ApifyClient(option ? { baseUrl: option } : {});
                expect(client.baseUrl).toBe(expected);
            });
        });

        describe('publicBaseUrl (APIFY_API_PUBLIC_BASE_URL)', () => {
            test.each([
                { case: 'defaults to production when unset', env: undefined, option: undefined, expected: 'https://api.apify.com/v2' },
                { case: 'uses the env var when no option is given', env: 'http://localhost:8080', option: undefined, expected: 'http://localhost:8080/v2' },
                { case: 'explicit option wins over the env var', env: 'http://localhost:8080', option: 'http://example.test', expected: 'http://example.test/v2' },
                { case: 'treats a blank-but-defined value as unset', env: '', option: undefined, expected: 'https://api.apify.com/v2' },
            ])('$case', ({ env, option, expected }) => {
                stubEnv('APIFY_API_PUBLIC_BASE_URL', env);
                const client = new ApifyClient(option ? { publicBaseUrl: option } : {});
                expect(client.publicBaseUrl).toBe(expected);
            });
        });

        describe('the two env vars are independent and each keeps the /v2 suffix', () => {
            test.each([
                { case: 'both unset resolve to their defaults', baseEnv: undefined, publicEnv: undefined, expectedBase: 'https://api.apify.com/v2', expectedPublic: 'https://api.apify.com/v2' },
                { case: 'only base set leaves public at its default', baseEnv: 'http://localhost:8080', publicEnv: undefined, expectedBase: 'http://localhost:8080/v2', expectedPublic: 'https://api.apify.com/v2' },
                { case: 'only public set leaves base at its default', baseEnv: undefined, publicEnv: 'http://localhost:8080', expectedBase: 'https://api.apify.com/v2', expectedPublic: 'http://localhost:8080/v2' },
                { case: 'both set get the /v2 suffix appended independently', baseEnv: 'http://localhost:8080', publicEnv: 'http://localhost:9090', expectedBase: 'http://localhost:8080/v2', expectedPublic: 'http://localhost:9090/v2' },
            ])('$case', ({ baseEnv, publicEnv, expectedBase, expectedPublic }) => {
                stubEnv('APIFY_API_BASE_URL', baseEnv);
                stubEnv('APIFY_API_PUBLIC_BASE_URL', publicEnv);
                const client = new ApifyClient();
                expect(client.baseUrl).toBe(expectedBase);
                expect(client.publicBaseUrl).toBe(expectedPublic);
            });
        });

        test('sub-clients inherit the resolved base URL and public base URL', () => {
            vi.stubEnv('APIFY_API_BASE_URL', 'http://localhost:8080');
            vi.stubEnv('APIFY_API_PUBLIC_BASE_URL', 'http://localhost:9090');
            const client = new ApifyClient();
            const dataset = client.dataset('some-id');
            expect((dataset as unknown as { baseUrl: string }).baseUrl).toBe('http://localhost:8080/v2');
            expect((dataset as unknown as { publicBaseUrl: string }).publicBaseUrl).toBe('http://localhost:9090/v2');
        });
    });
});
