// eslint-disable-next-line import/no-relative-packages
import { ApifyClient } from '../../../dist/bundle.cjs';

const client = new ApifyClient({
    token: 'xyz',
});

const actors = await client.actors().list();
console.log(actors);
