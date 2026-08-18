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
    const accountLimits = await client.user().limits();
    expect(accountLimits, 'the account limits could not be read').toBeDefined();

    // Data retention is an account-wide setting shared with every other suite and with the parallel
    // Node-version job, so the value it already has is written back rather than a new one. That still
    // exercises the request end to end, without a concurrent run observing or restoring the change.
    try {
        await client.user().updateLimits({ dataRetentionDays: accountLimits!.limits.dataRetentionDays });
    } catch (err) {
        // Free accounts reject changes to their limits outright, so a 400 or 403 is as valid an outcome
        // here as success - anything else means the request itself was malformed.
        expect(err).toBeInstanceOf(ApifyApiError);
        expect([400, 403]).toContain((err as ApifyApiError).statusCode);
    }
});
