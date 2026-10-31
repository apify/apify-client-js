import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });
const actorServerClient = client.actor('username/actor-name').server();

// Send a GET request to the /search endpoint of the Actor's server.
// The method returns error responses too, so check the status first.
const searchResponse = await actorServerClient.request('/search', { params: { q: 'apify' } });
if (searchResponse.status !== 200) throw new Error(`Search failed with status ${searchResponse.status}`);
console.log(searchResponse.data);

// Send a POST request with a JSON body.
const itemsResponse = await actorServerClient.request('/items', {
    method: 'POST',
    data: { url: 'https://apify.com' },
});
console.log(itemsResponse.status);
