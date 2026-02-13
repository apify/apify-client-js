import { ApifyClient } from '../../../dist/bundle.js';

const client = new ApifyClient({
    token: 'xyz',
});

const actors = await client.actors().list();
console.log(actors);
