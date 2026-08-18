import { beforeAll, expect, test } from 'vitest';

import type { ApifyClient } from 'apify-client';

import { makeClient } from './_fixtures.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

test('the client authenticates against the live API and resolves the current user', async () => {
    const me = await client.user('me').get();

    expect(me.username).toBeTruthy();
});
