import { ApifyClient, HttpClient } from 'apify-client';
import type { HttpRequest, HttpResponse } from 'apify-client';

class MyHttpClient extends HttpClient {
    override async sendRequest(request: HttpRequest): Promise<HttpResponse> {
        // Send the request with the HTTP library of your choice.
        throw new Error('Not implemented');
    }

    override isRetryableTransportError(error: unknown): boolean {
        // List the transport's transient failures here, such as its timeout and connection errors.
        // Returning false for everything opts out of transport retries entirely.
        return this.isTimeoutError(error);
    }
}

const client = ApifyClient.withCustomHttpClient({
    token: 'MY-APIFY-TOKEN',
    httpClient: new MyHttpClient(),
});
