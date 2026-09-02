import type { JsonValue } from 'type-fest';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import * as schemas from '../../src/schemas.js';
import { parseDateFields } from '../../src/utils.js';
import * as fixtures from './fixtures.js';

/** Which schema each fixture stands for -- the one the resource client validates that response against. */
const FIXTURE_SCHEMAS: Record<keyof typeof fixtures, keyof typeof schemas> = {
    actor: 'Actor',
    actorList: 'ListOfActors',
    run: 'Run',
    runList: 'ListOfRuns',
    dataset: 'Dataset',
    datasetList: 'ListOfDatasets',
    datasetStatistics: 'DatasetStatistics',
    keyValueStore: 'KeyValueStore',
    keyValueStoreList: 'ListOfKeyValueStores',
    keyList: 'ListOfKeys',
    requestQueue: 'RequestQueue',
    requestQueueList: 'ListOfRequestQueues',
    request: 'Request',
    requestList: 'ListOfRequests',
    requestRegistration: 'RequestRegistration',
    requestQueueHead: 'RequestQueueHead',
    lockedRequestQueueHead: 'LockedRequestQueueHead',
    requestLockInfo: 'RequestLockInfo',
    batchDeleteResult: 'BatchDeleteResult',
    unlockRequestsResult: 'UnlockRequestsResult',
    build: 'Build',
    buildList: 'ListOfBuilds',
    version: 'Version',
    versionList: 'ListOfVersions',
    envVar: 'EnvVar',
    envVarList: 'ListOfEnvVars',
    webhook: 'Webhook',
    webhookList: 'ListOfWebhooks',
    webhookDispatch: 'WebhookDispatch',
    webhookDispatchList: 'ListOfWebhookDispatches',
    task: 'Task',
    taskList: 'ListOfTasks',
    schedule: 'Schedule',
    scheduleList: 'ListOfSchedules',
    scheduleInvoked: 'ScheduleInvoked',
    storeActorList: 'ListOfStoreActors',
    user: 'UserPrivateInfo',
    monthlyUsage: 'MonthlyUsage',
    accountLimits: 'AccountLimits',
};

describe('mock server fixtures', () => {
    it.each(Object.entries(FIXTURE_SCHEMAS))('%s matches the %s schema', (fixture, schema) => {
        // The clients validate after `parseDateFields`, so the fixture is checked the same way -- including the
        // `date` field that `UserClient.monthlyUsage()` names for it.
        const shouldParseField = fixture === 'monthlyUsage' ? (key: string) => key === 'date' : null;
        const value = parseDateFields((fixtures as unknown as Record<string, JsonValue>)[fixture], shouldParseField);
        const result = (schemas as Record<string, z.ZodType>)[schema].safeParse(value);

        expect(result.error?.issues).toBeUndefined();
    });
});
