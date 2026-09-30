import { ApifyClient, ResponseValidationError } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    await client.actor('my-actor').get();
} catch (error) {
    if (error instanceof ResponseValidationError) {
        // Response from GET https://api.apify.com/v2/acts/my-actor does not match the API schema:
        // Invalid input: expected string, received null at `name`
        // The API returned something its OpenAPI specification does not describe. Please report this at https://github.com/apify/apify-client-js/issues.
        console.log(error.message);
        console.log(error.issues);
    }
}
