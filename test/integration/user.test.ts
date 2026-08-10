import { beforeAll, expect, test } from 'vitest';

import { ApifyApiError, type ApifyClient } from 'apify-client';

import { makeClient } from './_fixtures.js';

let client: ApifyClient;

beforeAll(() => {
    client = makeClient();
});

test('user().get() returns the authenticated user', async () => {
    const user = await client.user().get();

    expect(user.username).toBeTruthy();
});

test('user().limits() returns the account limits and current usage', async () => {
    const limits = await client.user().limits();

    expect(limits).toBeDefined();
    expect(limits!.limits).toBeTypeOf('object');
    expect(limits!.current).toBeTypeOf('object');
    expect(limits!.monthlyUsageCycle.startAt).toBeInstanceOf(Date);
});

test('user().monthlyUsage() returns the current billing cycle usage', async () => {
    const usage = await client.user().monthlyUsage();

    expect(usage).toBeDefined();
    expect(usage!.usageCycle.startAt).toBeInstanceOf(Date);
    expect(usage!.monthlyServiceUsage).toBeTypeOf('object');
    expect(Array.isArray(usage!.dailyServiceUsages)).toBe(true);
});

test('user().updateLimits() is accepted, or rejected with a client error the account does not allow', async () => {
    // Free accounts reject changes to their limits outright, so a 400 or 403 is as valid an outcome
    // here as success - anything else means the request itself was malformed.
    try {
        await client.user().updateLimits({ dataRetentionDays: 7 });
    } catch (err) {
        expect(err).toBeInstanceOf(ApifyApiError);
        expect([400, 403]).toContain((err as ApifyApiError).statusCode);
    }
});
