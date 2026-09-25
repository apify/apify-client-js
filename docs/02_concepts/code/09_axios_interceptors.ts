import { ApifyClient, AxiosHttpClient } from 'apify-client';

const httpClient = new AxiosHttpClient({
    maxRetries: 4,
    requestInterceptors: [
        (config) => {
            config.headers.set('X-Request-Id', crypto.randomUUID());
            return config;
        },
    ],
});

const client = ApifyClient.withCustomHttpClient({ token: 'MY-APIFY-TOKEN', httpClient });
