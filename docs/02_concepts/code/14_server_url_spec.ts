import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });
const actorServerClient = client.actor('username/actor-name').server();

// Get the URL of the Actor's server.
const serverUrl = await actorServerClient.getUrl();
console.log(serverUrl);

// Get the OpenAPI specification and list the server's endpoints.
const spec = await actorServerClient.getOpenApiSpec();
if (spec) {
    console.log(Object.keys(spec.paths as Record<string, unknown>));
}
