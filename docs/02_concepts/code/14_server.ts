import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });
const actorServerClient = client.actor('username/actor-name').server();

// Send a GET request to the /search endpoint of the Actor's server.
const searchResponse = await actorServerClient.request('/search', { params: { q: 'apify' } });
console.log(searchResponse.data);

// Send a POST request with a JSON body.
const itemsResponse = await actorServerClient.request('/items', {
    method: 'POST',
    data: { url: 'https://apify.com' },
});
console.log(itemsResponse.status);
