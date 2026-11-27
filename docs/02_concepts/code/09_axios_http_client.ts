import { ApifyClient } from 'apify-client';
import { AxiosHttpClient } from 'apify-client/axios';

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
