/**
 * Spec-shaped response bodies for the mock server, one per schema the resource clients validate against.
 *
 * Generated from the `examples` in the OpenAPI specification by a one-off script, then kept as plain data: the
 * unit tests must not depend on the specification being available. `fixtures.test.ts` checks that every fixture
 * still passes the schema it stands for, so a regeneration that tightens a schema shows up there.
 */

/** `Actor` */
export const actor = {
    id: 'zdc3Pyhyz3m8vjDeM',
    userId: 'wRsJZtadYvn4mBZmm',
    name: 'google-search-extractor',
    username: 'compass',
    description: 'Extract data from hundreds of places fast.',
    restartOnError: false,
    isPublic: false,
    actorPermissionLevel: 'LIMITED_PERMISSIONS',
    createdAt: '2019-07-08T11:27:57.401Z',
    modifiedAt: '2019-07-08T14:01:05.546Z',
    stats: {
        totalBuilds: 9,
        totalRuns: 16,
        totalUsers: 6,
        totalUsers7Days: 2,
        totalUsers30Days: 6,
        totalUsers90Days: 6,
        totalMetamorphs: 2,
        lastRunStartedAt: '2019-07-08T14:01:05.546Z',
        actorReviewCount: 69,
        actorReviewRating: 4.7,
        bookmarkCount: 1269,
        publicActorRunStats30Days: {
            ABORTED: 2542,
            FAILED: 1234,
            SUCCEEDED: 732805,
            'TIMED-OUT': 12556,
            TOTAL: 749137,
        },
    },
    versions: [
        {
            versionNumber: '0.0',
            sourceType: 'SOURCE_FILES',
            envVars: [
                {
                    name: 'MY_ENV_VAR',
                    value: 'my-value',
                    isSecret: false,
                },
            ],
            applyEnvVarsToBuild: false,
            buildTag: 'latest',
            sourceFiles: [
                {
                    format: 'BASE64',
                    content: "console.log('This is the main.js file');",
                    name: 'src/main.js',
                },
            ],
            gitRepoUrl: 'string',
            tarballUrl: 'string',
            gitHubGistUrl: 'string',
        },
    ],
    pricingInfos: [
        {
            apifyMarginPercentage: 0.2,
            createdAt: '2019-12-12T07:34:14.202Z',
            startedAt: '2019-12-12T07:34:14.202Z',
            pricingModel: 'PAY_PER_EVENT',
            pricingPerEvent: {
                actorChargeEvents: {
                    key: {
                        eventTitle: 'string',
                        eventDescription: 'string',
                        eventPriceUsd: 1,
                        eventTieredPricingUsd: {
                            key: {
                                tieredEventPriceUsd: 1,
                            },
                        },
                        isPrimaryEvent: false,
                        isOneTimeEvent: false,
                    },
                },
            },
            minimalMaxTotalChargeUsd: 1,
        },
    ],
    defaultRunOptions: {
        build: 'latest',
        timeoutSecs: 3600,
        memoryMbytes: 2048,
        restartOnError: false,
        maxItems: 1,
        forcePermissionLevel: 'LIMITED_PERMISSIONS',
    },
    exampleRunInput: {
        body: '{ "helloWorld": 123 }',
        contentType: 'application/json; charset=utf-8',
    },
    isDeprecated: false,
    deploymentKey: 'ssh-rsa AAAA ...',
    title: 'Google Search Extractor',
    taggedBuilds: {
        key: {
            buildId: 'z2EryhbfhgSyqj6Hn',
            buildNumber: '0.0.2',
            buildNumberInt: 42,
            finishedAt: '2019-06-10T11:15:49.286Z',
        },
    },
    actorStandby: {
        isEnabled: false,
        desiredRequestsPerActorRun: 1,
        maxRequestsPerActorRun: 1,
        idleTimeoutSecs: 1,
        build: 'string',
        memoryMbytes: 1,
        disableStandbyFieldsOverride: false,
        shouldPassActorInput: false,
    },
    readmeSummary: 'string',
    seoTitle: 'Web Scraper',
    seoDescription: 'Crawls websites using Chrome and extracts data from pages using JavaScript.',
    pictureUrl: 'https://apify-image-uploads-prod.s3.amazonaws.com/.../actor-picture.png',
    standbyUrl: 'https://jane35--my-actor.apify.actor',
    notice: 'NONE',
    categories: ['DEVELOPER_TOOLS', 'OPEN_SOURCE'],
    isCritical: false,
    isGeneric: false,
    isSourceCodeHidden: true,
    hasNoDataset: false,
};

/** `ListOfActors` */
export const actorList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'br9CKmk457',
            createdAt: '2019-10-29T07:34:24.202Z',
            modifiedAt: '2019-10-30T07:34:24.202Z',
            name: 'MyAct',
            username: 'janedoe',
            title: 'Hello World Example',
            stats: {
                totalBuilds: 9,
                totalRuns: 16,
                totalUsers: 6,
                totalUsers7Days: 2,
                totalUsers30Days: 6,
                totalUsers90Days: 6,
                totalMetamorphs: 2,
                lastRunStartedAt: '2019-07-08T14:01:05.546Z',
                actorReviewCount: 69,
                actorReviewRating: 4.7,
                bookmarkCount: 1269,
                publicActorRunStats30Days: {
                    ABORTED: 2542,
                    FAILED: 1234,
                    SUCCEEDED: 732805,
                    'TIMED-OUT': 12556,
                    TOTAL: 749137,
                },
            },
        },
    ],
};

/** `Run` */
export const run = {
    id: 'HG7ML7M8z78YcAPEB',
    actId: 'HDSasDasz78YcAPEB',
    userId: '7sT5jcggjjA9fNcxF',
    actorTaskId: 'KJHSKHausidyaJKHs',
    startedAt: '2019-11-30T07:34:24.202Z',
    finishedAt: '2019-12-12T09:30:12.202Z',
    status: 'READY',
    statusMessage: 'Actor is running',
    isStatusMessageTerminal: false,
    meta: {
        origin: 'DEVELOPMENT',
        clientIp: 'string',
        userAgent: 'string',
        scheduleId: 'string',
        scheduledAt: '2019-12-12T07:34:14.202Z',
    },
    pricingInfo: {
        apifyMarginPercentage: 0.2,
        createdAt: '2019-12-12T07:34:14.202Z',
        startedAt: '2019-12-12T07:34:14.202Z',
        pricingModel: 'PAY_PER_EVENT',
        pricingPerEvent: {
            actorChargeEvents: {
                key: {
                    eventTitle: 'string',
                    eventDescription: 'string',
                    eventPriceUsd: 1,
                    eventTieredPricingUsd: {
                        key: {
                            tieredEventPriceUsd: 1,
                        },
                    },
                    isPrimaryEvent: false,
                    isOneTimeEvent: false,
                },
            },
        },
        minimalMaxTotalChargeUsd: 1,
    },
    stats: {
        inputBodyLen: 240,
        migrationCount: 0,
        rebootCount: 0,
        restartCount: 0,
        resurrectCount: 2,
        memAvgBytes: 267874071.9,
        memMaxBytes: 404713472,
        memCurrentBytes: 0,
        cpuAvgUsage: 33.7532101107538,
        cpuMaxUsage: 169.650735534941,
        cpuCurrentUsage: 0,
        netRxBytes: 103508042,
        netTxBytes: 4854600,
        durationMillis: 248472,
        runTimeSecs: 248.472,
        metamorph: 0,
        computeUnits: 0.13804,
    },
    chargedEventCounts: {
        key: 1,
    },
    options: {
        build: 'latest',
        timeoutSecs: 300,
        memoryMbytes: 1024,
        diskMbytes: 2048,
        maxItems: 1000,
        maxTotalChargeUsd: 5,
    },
    buildId: '7sT5jcggjjA9fNcxF',
    exitCode: 0,
    generalAccess: 'ANYONE_WITH_ID_CAN_READ',
    defaultKeyValueStoreId: 'eJNzqsbPiopwJcgGQ',
    defaultDatasetId: 'wmKPijuyDnPZAPRMk',
    defaultRequestQueueId: 'FL35cSF7jrxr3BY39',
    storageIds: {
        datasets: {
            default: 'wmKPijuyDnPZAPRMk',
        },
        keyValueStores: {
            default: 'eJNzqsbPiopwJcgGQ',
        },
        requestQueues: {
            default: 'FL35cSF7jrxr3BY39',
        },
    },
    buildNumber: '0.0.36',
    containerUrl: 'https://g8kd8kbc5ge8.runs.apify.net',
    isContainerServerReady: true,
    gitBranchName: 'master',
    usage: {
        ACTOR_COMPUTE_UNITS: 3,
        DATASET_READS: 4,
        DATASET_WRITES: 4,
        KEY_VALUE_STORE_READS: 5,
        KEY_VALUE_STORE_WRITES: 3,
        KEY_VALUE_STORE_LISTS: 5,
        REQUEST_QUEUE_READS: 2,
        REQUEST_QUEUE_WRITES: 1,
        DATA_TRANSFER_INTERNAL_GBYTES: 1,
        DATA_TRANSFER_EXTERNAL_GBYTES: 3,
        PROXY_RESIDENTIAL_TRANSFER_GBYTES: 34,
        PROXY_SERPS: 3,
    },
    usageTotalUsd: 0.2654,
    usageUsd: {
        ACTOR_COMPUTE_UNITS: 0.0003,
        DATASET_READS: 0.0001,
        DATASET_WRITES: 0.0001,
        KEY_VALUE_STORE_READS: 0.0001,
        KEY_VALUE_STORE_WRITES: 0.00005,
        KEY_VALUE_STORE_LISTS: 0.0001,
        REQUEST_QUEUE_READS: 0.0001,
        REQUEST_QUEUE_WRITES: 0.0001,
        DATA_TRANSFER_INTERNAL_GBYTES: 0.001,
        DATA_TRANSFER_EXTERNAL_GBYTES: 0.003,
        PROXY_RESIDENTIAL_TRANSFER_GBYTES: 0.034,
        PROXY_SERPS: 0.003,
    },
    metamorphs: [
        {
            createdAt: '2019-11-30T07:39:24.202Z',
            actorId: 'nspoEjklmnsF2oosD',
            buildId: 'ME6oKecqy5kXDS4KQ',
            inputKey: 'INPUT-METAMORPH-1',
        },
    ],
    platformUsageBillingModel: 'USER',
};

/** `ListOfRuns` */
export const runList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'HG7ML7M8z78YcAPEB',
            actId: 'HDSasDasz78YcAPEB',
            userId: '7sT5jcggjjA9fNcxF',
            actorTaskId: 'KJHSKHausidyaJKHs',
            status: 'READY',
            startedAt: '2019-11-30T07:34:24.202Z',
            finishedAt: '2019-12-12T09:30:12.202Z',
            buildId: 'HG7ML7M8z78YcAPEB',
            buildNumber: '0.0.2',
            buildNumberInt: 10000,
            meta: {
                origin: 'DEVELOPMENT',
                clientIp: 'string',
                userAgent: 'string',
                scheduleId: 'string',
                scheduledAt: '2019-12-12T07:34:14.202Z',
            },
            usageTotalUsd: 0.2,
            defaultKeyValueStoreId: 'sfAjeR4QmeJCQzTfe',
            defaultDatasetId: '3ZojQDdFTsyE7Moy4',
            defaultRequestQueueId: 'so93g2shcDzK3pA85',
        },
    ],
};

/** `Dataset` */
export const dataset = {
    id: 'WkzbQMuFYuamGv3YF',
    name: 'd7b9MDYsbtX5L7XAj',
    userId: 'wRsJZtadYvn4mBZmm',
    createdAt: '2019-12-12T07:34:14.202Z',
    modifiedAt: '2019-12-13T08:36:13.202Z',
    accessedAt: '2019-12-14T08:36:13.202Z',
    itemCount: 7,
    cleanItemCount: 5,
    actId: 'string',
    actRunId: 'string',
    fields: ['string'],
    schema: {},
    consoleUrl: 'https://console.apify.com/storage/datasets/27TmTznX9YPeAYhkC',
    itemsPublicUrl: 'https://api.apify.com/v2/datasets/WkzbQMuFYuamGv3YF/items?signature=abc123',
    generalAccess: 'ANYONE_WITH_ID_CAN_READ',
    stats: {
        readCount: 22,
        writeCount: 3,
        storageBytes: 783,
        inflatedBytes: 0,
    },
};

/** `ListOfDatasets` */
export const datasetList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    unnamed: false,
    items: [
        {
            id: 'WkzbQMuFYuamGv3YF',
            name: 'd7b9MDYsbtX5L7XAj',
            userId: 'tbXmWu7GCxnyYtSiL',
            createdAt: '2019-12-12T07:34:14.202Z',
            modifiedAt: '2019-12-13T08:36:13.202Z',
            accessedAt: '2019-12-14T08:36:13.202Z',
            itemCount: 7,
            cleanItemCount: 5,
            actId: 'zdc3Pyhyz3m8vjDeM',
            actRunId: 'HG7ML7M8z78YcAPEB',
            title: 'My Dataset',
            username: 'janedoe',
            generalAccess: 'ANYONE_WITH_ID_CAN_READ',
            stats: {
                readCount: 22,
                writeCount: 3,
                storageBytes: 783,
                inflatedBytes: 0,
            },
        },
    ],
};

/** `DatasetStatistics` */
export const datasetStatistics = {
    fieldStatistics: {
        key: {
            min: 1,
            max: 1,
            nullCount: 1,
            emptyCount: 1,
        },
    },
};

/** `KeyValueStore` */
export const keyValueStore = {
    id: 'WkzbQMuFYuamGv3YF',
    name: 'd7b9MDYsbtX5L7XAj',
    userId: 'BPWDBd7Z9c746JAnF',
    username: 'janedoe',
    createdAt: '2019-12-12T07:34:14.202Z',
    modifiedAt: '2019-12-13T08:36:13.202Z',
    accessedAt: '2019-12-14T08:36:13.202Z',
    actId: 'string',
    actRunId: 'string',
    consoleUrl: 'https://console.apify.com/storage/key-value-stores/27TmTznX9YPeAYhkC',
    keysPublicUrl: 'https://api.apify.com/v2/key-value-stores/WkzbQMuFYuamGv3YF/keys?signature=abc123',
    recordsPublicUrl: 'https://api.apify.com/v2/key-value-stores/WkzbQMuFYuamGv3YF/records',
    schema: {},
    generalAccess: 'ANYONE_WITH_ID_CAN_READ',
    stats: {
        readCount: 9,
        writeCount: 3,
        deleteCount: 6,
        listCount: 2,
        s3StorageBytes: 18,
        storageBytes: 457225,
    },
};

/** `ListOfKeyValueStores` */
export const keyValueStoreList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    unnamed: false,
    items: [
        {
            id: 'WkzbQMuFYuamGv3YF',
            name: 'd7b9MDYsbtX5L7XAj',
            userId: 'BPWDBd7Z9c746JAnF',
            username: 'janedoe',
            createdAt: '2019-12-12T07:34:14.202Z',
            modifiedAt: '2019-12-13T08:36:13.202Z',
            accessedAt: '2019-12-14T08:36:13.202Z',
            actId: 'string',
            actRunId: 'string',
            consoleUrl: 'https://console.apify.com/storage/key-value-stores/27TmTznX9YPeAYhkC',
            keysPublicUrl: 'https://api.apify.com/v2/key-value-stores/WkzbQMuFYuamGv3YF/keys?signature=abc123',
            recordsPublicUrl: 'https://api.apify.com/v2/key-value-stores/WkzbQMuFYuamGv3YF/records',
            schema: {},
            generalAccess: 'ANYONE_WITH_ID_CAN_READ',
            stats: {
                readCount: 9,
                writeCount: 3,
                deleteCount: 6,
                listCount: 2,
                s3StorageBytes: 18,
                storageBytes: 457225,
            },
        },
    ],
};

/** `ListOfKeys` */
export const keyList = {
    items: [
        {
            key: 'second-key',
            size: 36,
            recordPublicUrl:
                'https://api.apify.com/v2/key-value-stores/WkzbQMuFYuamGv3YF/records/some-key?signature=abc123',
        },
    ],
    count: 2,
    limit: 2,
    exclusiveStartKey: 'some-key',
    isTruncated: true,
    nextExclusiveStartKey: 'third-key',
};

/** `RequestQueue` */
export const requestQueue = {
    id: 'WkzbQMuFYuamGv3YF',
    name: 'some-name',
    userId: 'wRsJZtadYvn4mBZmm',
    actId: 'string',
    actRunId: 'string',
    createdAt: '2019-12-12T07:34:14.202Z',
    modifiedAt: '2019-12-13T08:36:13.202Z',
    accessedAt: '2019-12-14T08:36:13.202Z',
    totalRequestCount: 870,
    handledRequestCount: 100,
    pendingRequestCount: 670,
    hadMultipleClients: true,
    consoleUrl: 'https://api.apify.com/v2/request-queues/27TmTznX9YPeAYhkC',
    stats: {
        deleteCount: 0,
        headItemReadCount: 5,
        readCount: 100,
        storageBytes: 1024,
        writeCount: 10,
    },
    generalAccess: 'ANYONE_WITH_ID_CAN_READ',
};

/** `ListOfRequestQueues` */
export const requestQueueList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    unnamed: false,
    items: [
        {
            id: 'WkzbQMuFYuamGv3YF',
            name: 'some-name',
            userId: 'wRsJZtadYvn4mBZmm',
            username: 'janedoe',
            createdAt: '2019-12-12T07:34:14.202Z',
            modifiedAt: '2019-12-13T08:36:13.202Z',
            accessedAt: '2019-12-14T08:36:13.202Z',
            expireAt: '2019-06-02T17:15:06.751Z',
            totalRequestCount: 870,
            handledRequestCount: 100,
            pendingRequestCount: 670,
            actId: 'string',
            actRunId: 'string',
            hadMultipleClients: true,
            generalAccess: 'ANYONE_WITH_ID_CAN_READ',
            stats: {
                deleteCount: 0,
                headItemReadCount: 5,
                readCount: 100,
                storageBytes: 1024,
                writeCount: 10,
            },
        },
    ],
};

/** `Request` */
export const request = {
    uniqueKey: 'GET|60d83e70|e3b0c442|https://apify.com',
    url: 'https://apify.com',
    method: 'GET',
    retryCount: 0,
    loadedUrl: 'https://apify.com/jobs',
    payload: 'string',
    headers: {},
    userData: {},
    noRetry: false,
    errorMessages: ['string'],
    handledAt: '2019-06-16T10:23:31.607Z',
    id: 'sbJ7klsdf7ujN9l',
};

/** `ListOfRequests` */
export const requestList = {
    items: [
        {
            uniqueKey: 'GET|60d83e70|e3b0c442|https://apify.com',
            url: 'https://apify.com',
            method: 'GET',
            retryCount: 0,
            loadedUrl: 'https://apify.com/jobs',
            payload: 'string',
            headers: {},
            userData: {},
            noRetry: false,
            errorMessages: ['string'],
            handledAt: '2019-06-16T10:23:31.607Z',
            id: 'sbJ7klsdf7ujN9l',
        },
    ],
    limit: 2,
    exclusiveStartId: 'Ihnsp8YrvJ8102Kj',
    cursor: 'eyJyZXF1ZXN0SWQiOiI0SVlLUWFXZ2FKUUlWNlMifQ',
    nextCursor: 'eyJyZXF1ZXN0SWQiOiI5eFNNc1BrN1J6VUxTNXoifQ',
};

/** `RequestRegistration` */
export const requestRegistration = {
    requestId: 'sbJ7klsdf7ujN9l',
    wasAlreadyPresent: false,
    wasAlreadyHandled: false,
};

/** `RequestQueueHead` */
export const requestQueueHead = {
    limit: 1000,
    queueModifiedAt: '2019-12-13T08:36:13.202Z',
    hadMultipleClients: true,
    items: [
        {
            id: 'sbJ7klsdf7ujN9l',
            uniqueKey: 'GET|60d83e70|e3b0c442|https://apify.com',
            url: 'https://apify.com',
            method: 'GET',
            retryCount: 0,
        },
    ],
};

/** `LockedRequestQueueHead` */
export const lockedRequestQueueHead = {
    limit: 1000,
    queueModifiedAt: '2019-12-13T08:36:13.202Z',
    queueHasLockedRequests: true,
    clientKey: 'client-one',
    hadMultipleClients: true,
    lockSecs: 60,
    items: [
        {
            id: 'sbJ7klsdf7ujN9l',
            uniqueKey: 'GET|60d83e70|e3b0c442|https://apify.com',
            url: 'https://apify.com',
            method: 'GET',
            retryCount: 0,
            lockExpiresAt: '2022-06-14T23:00:00.000Z',
        },
    ],
};

/** `RequestLockInfo` */
export const requestLockInfo = {
    lockExpiresAt: '2022-06-14T23:00:00.000Z',
};

/** `BatchDeleteResult` */
export const batchDeleteResult = {
    processedRequests: [
        {
            uniqueKey: 'GET|60d83e70|e3b0c442|https://apify.com',
            id: 'sbJ7klsdf7ujN9l',
        },
    ],
    unprocessedRequests: [
        {
            id: 'sbJ7klsdf7ujN9l',
            uniqueKey: 'GET|60d83e70|e3b0c442|https://apify.com',
            url: 'https://apify.com',
            method: 'GET',
        },
    ],
};

/** `UnlockRequestsResult` */
export const unlockRequestsResult = {
    unlockedCount: 10,
};

/** `Build` */
export const build = {
    id: 'HG7ML7M8z78YcAPEB',
    actId: 'janedoe~my-actor',
    userId: 'klmdEpoiojmdEMlk3',
    startedAt: '2019-11-30T07:34:24.202Z',
    finishedAt: '2019-12-12T09:30:12.202Z',
    status: 'READY',
    meta: {
        origin: 'DEVELOPMENT',
        clientIp: '172.234.12.34',
        userAgent: 'Mozilla/5.0 (iPad)',
    },
    stats: {
        durationMillis: 1000,
        runTimeSecs: 45.718,
        computeUnits: 0.0126994444444444,
        imageSizeBytes: 975770223,
    },
    options: {
        useCache: false,
        betaPackages: false,
        memoryMbytes: 1024,
        diskMbytes: 2048,
    },
    usage: {
        ACTOR_COMPUTE_UNITS: 0.08,
    },
    usageTotalUsd: 0.02,
    usageUsd: {
        ACTOR_COMPUTE_UNITS: 0.08,
    },
    inputSchema: '{\\n  "title": "Schema for ... }',
    readme: '# Magic Actor\\nThis Actor is magic.',
    buildNumber: '0.1.1',
    actVersion: {
        sourceType: 'SOURCE_FILES',
        buildTag: 'experimental',
        versionNumber: '0.0',
        gitRepoUrl: 'https://github.com/apifytech/actor-crawler.git#experimental:web-scraper',
        sourceFiles: [
            {
                format: 'BASE64',
                content: "console.log('This is the main.js file');",
                name: 'src/main.js',
            },
        ],
    },
    actorDefinition: {
        actorSpecification: 1,
        name: 'string',
        version: '0.1',
        buildTag: 'string',
        environmentVariables: {
            key: 'string',
        },
        dockerfile: 'string',
        dockerContextDir: 'string',
        readme: 'string',
        input: {},
        changelog: 'string',
        storages: {
            dataset: {},
        },
        defaultMemoryMbytes: 'get(input',
        minMemoryMbytes: 128,
        maxMemoryMbytes: 128,
        usesStandbyMode: false,
    },
};

/** `ListOfBuilds` */
export const buildList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'HG7ML7M8z78YcAPEB',
            actId: 'janedoe~my-actor',
            userId: 'klmdEpoiojmdEMlk3',
            status: 'READY',
            startedAt: '2019-11-30T07:34:24.202Z',
            finishedAt: '2019-12-12T09:30:12.202Z',
            usageTotalUsd: 0.02,
            buildNumber: '0.1.1',
            buildNumberInt: 10000,
            meta: {
                origin: 'DEVELOPMENT',
                clientIp: '172.234.12.34',
                userAgent: 'Mozilla/5.0 (iPad)',
            },
        },
    ],
};

/** `Version` */
export const version = {
    versionNumber: '0.0',
    sourceType: 'SOURCE_FILES',
    envVars: [
        {
            name: 'MY_ENV_VAR',
            value: 'my-value',
            isSecret: false,
        },
    ],
    applyEnvVarsToBuild: false,
    buildTag: 'latest',
    sourceFiles: [
        {
            format: 'BASE64',
            content: "console.log('This is the main.js file');",
            name: 'src/main.js',
        },
    ],
    gitRepoUrl: 'string',
    tarballUrl: 'string',
    gitHubGistUrl: 'string',
};

/** `ListOfVersions` */
export const versionList = {
    total: 5,
    items: [
        {
            versionNumber: '0.0',
            sourceType: 'SOURCE_FILES',
            envVars: [
                {
                    name: 'MY_ENV_VAR',
                    value: 'my-value',
                    isSecret: false,
                },
            ],
            applyEnvVarsToBuild: false,
            buildTag: 'latest',
            sourceFiles: [
                {
                    format: 'BASE64',
                    content: "console.log('This is the main.js file');",
                    name: 'src/main.js',
                },
            ],
            gitRepoUrl: 'string',
            tarballUrl: 'string',
            gitHubGistUrl: 'string',
        },
    ],
};

/** `EnvVar` */
export const envVar = {
    name: 'MY_ENV_VAR',
    value: 'my-value',
    isSecret: false,
};

/** `ListOfEnvVars` */
export const envVarList = {
    total: 5,
    items: [
        {
            name: 'MY_ENV_VAR',
            value: 'my-value',
            isSecret: false,
        },
    ],
};

/** `Webhook` */
export const webhook = {
    id: 'YiKoxjkaS9gjGTqhF',
    createdAt: '2019-12-12T07:34:14.202Z',
    modifiedAt: '2019-12-13T08:36:13.202Z',
    userId: 'wRsJZtadYvn4mBZmm',
    isAdHoc: false,
    shouldInterpolateStrings: false,
    eventTypes: ['ACTOR.BUILD.ABORTED'],
    condition: {
        actorId: 'hksJZtadYvn4mBuin',
        actorTaskId: 'asdLZtadYvn4mBZmm',
        actorRunId: 'hgdKZtadYvn4mBpoi',
    },
    ignoreSslErrors: false,
    doNotRetry: false,
    requestUrl: 'http://example.com/',
    payloadTemplate: '{\\n "userId": {{userId}}...',
    headersTemplate: '{\\n "Authorization": "Bearer ..."}',
    description: 'this is webhook description',
    lastDispatch: {
        status: 'ACTIVE',
        finishedAt: '2019-12-13T08:36:13.202Z',
        removedAt: '2019-12-12T07:34:14.202Z',
    },
    stats: {
        totalDispatches: 1,
    },
};

/** `ListOfWebhooks` */
export const webhookList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'YiKoxjkaS9gjGTqhF',
            createdAt: '2019-12-12T07:34:14.202Z',
            modifiedAt: '2019-12-13T08:36:13.202Z',
            userId: 'wRsJZtadYvn4mBZmm',
            isAdHoc: false,
            isApifyIntegration: false,
            isEnabled: true,
            actionType: 'HTTP_REQUEST',
            shouldInterpolateStrings: false,
            eventTypes: ['ACTOR.BUILD.ABORTED'],
            condition: {
                actorId: 'hksJZtadYvn4mBuin',
                actorTaskId: 'asdLZtadYvn4mBZmm',
                actorRunId: 'hgdKZtadYvn4mBpoi',
            },
            ignoreSslErrors: false,
            doNotRetry: false,
            requestUrl: 'http://example.com/',
            lastDispatch: {
                status: 'ACTIVE',
                finishedAt: '2019-12-13T08:36:13.202Z',
                removedAt: '2019-12-12T07:34:14.202Z',
            },
            stats: {
                totalDispatches: 1,
            },
        },
    ],
};

/** `WebhookDispatch` */
export const webhookDispatch = {
    id: 'asdLZtadYvn4mBZmm',
    userId: 'wRsJZtadYvn4mBZmm',
    webhookId: 'asdLZtadYvn4mBZmm',
    createdAt: '2019-12-12T07:34:14.202Z',
    status: 'ACTIVE',
    eventType: 'ACTOR.BUILD.ABORTED',
    eventData: {
        actorId: 'vvE7iMKuMc5qTHHsR',
        actorRunId: 'JgwXN9BdwxGcu9MMF',
        actorBuildId: 'HG7ML7M8z78YcAPEB',
        actorTaskId: 'zRLp8SDOZz2NyLg7K',
    },
    webhook: {
        actionType: 'HTTP_REQUEST',
        condition: {
            actorId: 'hksJZtadYvn4mBuin',
            actorTaskId: 'asdLZtadYvn4mBZmm',
            actorRunId: 'hgdKZtadYvn4mBpoi',
        },
        requestUrl: 'https://example.com/webhook',
        isAdHoc: false,
    },
    calls: [
        {
            startedAt: '2019-12-12T07:34:14.202Z',
            finishedAt: '2019-12-12T07:34:14.202Z',
            errorMessage: 'Cannot send request',
            responseStatus: 200,
            responseBody: '{"foo": "bar"}',
        },
    ],
};

/** `ListOfWebhookDispatches` */
export const webhookDispatchList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'asdLZtadYvn4mBZmm',
            userId: 'wRsJZtadYvn4mBZmm',
            webhookId: 'asdLZtadYvn4mBZmm',
            createdAt: '2019-12-12T07:34:14.202Z',
            status: 'ACTIVE',
            eventType: 'ACTOR.BUILD.ABORTED',
            eventData: {
                actorId: 'vvE7iMKuMc5qTHHsR',
                actorRunId: 'JgwXN9BdwxGcu9MMF',
                actorBuildId: 'HG7ML7M8z78YcAPEB',
                actorTaskId: 'zRLp8SDOZz2NyLg7K',
            },
            webhook: {
                actionType: 'HTTP_REQUEST',
                condition: {
                    actorId: 'hksJZtadYvn4mBuin',
                    actorTaskId: 'asdLZtadYvn4mBZmm',
                    actorRunId: 'hgdKZtadYvn4mBpoi',
                },
                requestUrl: 'https://example.com/webhook',
                isAdHoc: false,
            },
            calls: [
                {
                    startedAt: '2019-12-12T07:34:14.202Z',
                    finishedAt: '2019-12-12T07:34:14.202Z',
                    errorMessage: 'Cannot send request',
                    responseStatus: 200,
                    responseBody: '{"foo": "bar"}',
                },
            ],
        },
    ],
};

/** `Task` */
export const task = {
    id: 'zdc3Pyhyz3m8vjDeM',
    userId: 'wRsJZtadYvn4mBZmm',
    actId: 'asADASadYvn4mBZmm',
    name: 'my-task',
    username: 'janedoe',
    createdAt: '2018-10-26T07:23:14.855Z',
    modifiedAt: '2018-10-26T13:30:49.578Z',
    removedAt: '2019-12-12T07:34:14.202Z',
    stats: {
        totalRuns: 15,
    },
    options: {
        build: 'latest',
        timeoutSecs: 300,
        memoryMbytes: 1024,
        maxItems: 1000,
        maxTotalChargeUsd: 5,
        restartOnError: false,
    },
    input: {},
    title: 'string',
    actorStandby: {
        isEnabled: false,
        desiredRequestsPerActorRun: 1,
        maxRequestsPerActorRun: 1,
        idleTimeoutSecs: 1,
        build: 'string',
        memoryMbytes: 1,
        disableStandbyFieldsOverride: false,
        shouldPassActorInput: false,
    },
    standbyUrl: 'https://example.com',
    isPublic: false,
    publicConfig: {
        publishedAt: '2025-06-16T09:20:45.777Z',
        seoTitle: 'Scrape data from a website',
        seoDescription: 'string',
        inputSchemaFields: ['string'],
        datasetName: 'string',
        datasetView: 'string',
    },
};

/** `ListOfTasks` */
export const taskList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'zdc3Pyhyz3m8vjDeM',
            userId: 'wRsJZtadYvn4mBZmm',
            actId: 'asADASadYvn4mBZmm',
            actName: 'my-actor',
            name: 'my-task',
            username: 'janedoe',
            actUsername: 'janedoe',
            createdAt: '2018-10-26T07:23:14.855Z',
            modifiedAt: '2018-10-26T13:30:49.578Z',
            stats: {
                totalRuns: 15,
            },
        },
    ],
};

/** `Schedule` */
export const schedule = {
    id: 'asdLZtadYvn4mBZmm',
    userId: 'wRsJZtadYvn4mBZmm',
    name: 'my-schedule',
    cronExpression: '* * * * *',
    timezone: 'UTC',
    isEnabled: true,
    isExclusive: true,
    createdAt: '2019-12-12T07:34:14.202Z',
    modifiedAt: '2019-12-20T06:33:11.202Z',
    nextRunAt: '2019-04-12T07:34:10.202Z',
    lastRunAt: '2019-04-12T07:33:10.202Z',
    description: 'Schedule of actor ...',
    title: 'string',
    notifications: {
        email: true,
    },
    actions: [
        {
            id: 'c6KfSgoQzFhMk3etc',
            type: 'RUN_ACTOR',
            actorId: 'jF8GGEvbEg4Au3NLA',
            runInput: {
                body: '{\\n   "foo": "actor"\\n}',
                contentType: 'application/json; charset=utf-8',
            },
            runOptions: {
                build: 'latest',
                timeoutSecs: 300,
                memoryMbytes: 1024,
                maxItems: 1000,
                maxTotalChargeUsd: 5,
                restartOnError: false,
            },
        },
    ],
};

/** `ListOfSchedules` */
export const scheduleList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'asdLZtadYvn4mBZmm',
            userId: 'wRsJZtadYvn4mBZmm',
            name: 'my-schedule',
            cronExpression: '* * * * *',
            timezone: 'UTC',
            isEnabled: true,
            isExclusive: true,
            createdAt: '2019-12-12T07:34:14.202Z',
            modifiedAt: '2019-12-20T06:33:11.202Z',
            nextRunAt: '2019-04-12T07:34:10.202Z',
            lastRunAt: '2019-04-12T07:33:10.202Z',
            actions: [
                {
                    id: 'ZReCs7hkdieq8ZUki',
                    type: 'RUN_ACTOR',
                    actorId: 'HKhKmiCMrDgu9eXeE',
                },
            ],
        },
    ],
};

/** `ScheduleInvoked` */
export const scheduleInvoked = {
    message: 'Schedule invoked',
    level: 'INFO',
    createdAt: '2019-03-26T12:28:00.370Z',
};

/** `ListOfStoreActors` */
export const storeActorList = {
    total: 1,
    offset: 0,
    limit: 1000,
    desc: false,
    count: 1,
    items: [
        {
            id: 'zdc3Pyhyz3m8vjDeM',
            title: 'My Public Actor',
            name: 'my-public-actor',
            username: 'jane35',
            userFullName: 'Jane H. Doe',
            description: 'My public actor!',
            categories: ['MARKETING', 'LEAD_GENERATION'],
            notice: 'NONE',
            pictureUrl: 'https://...',
            userPictureUrl: 'https://...',
            url: 'https://...',
            stats: {
                totalBuilds: 9,
                totalRuns: 16,
                totalUsers: 6,
                totalUsers7Days: 2,
                totalUsers30Days: 6,
                totalUsers90Days: 6,
                totalMetamorphs: 2,
                lastRunStartedAt: '2019-07-08T14:01:05.546Z',
                actorReviewCount: 69,
                actorReviewRating: 4.7,
                bookmarkCount: 1269,
                publicActorRunStats30Days: {
                    ABORTED: 2542,
                    FAILED: 1234,
                    SUCCEEDED: 732805,
                    'TIMED-OUT': 12556,
                    TOTAL: 749137,
                },
            },
            currentPricingInfo: {
                pricingModel: 'FREE',
                apifyMarginPercentage: 0.2,
                createdAt: '2023-01-01T00:00:00.000Z',
                startedAt: '2023-01-01T00:00:00.000Z',
                notifiedAboutChangeAt: '2019-12-12T07:34:14.202Z',
                notifiedAboutFutureChangeAt: '2019-12-12T07:34:14.202Z',
                isPriceChangeNotificationSuppressed: false,
                forceContainsSignificantPriceChange: false,
                isPPEPlatformUsagePaidByUser: false,
                reasonForChange: 'string',
                trialMinutes: 1,
                unitName: 'string',
                pricePerUnitUsd: 1,
                minimalMaxTotalChargeUsd: 0.5,
                pricingPerEvent: {},
            },
            isWhiteListedForAgenticPayments: false,
            actorReviewCount: 69,
            actorReviewRating: 4.7,
            bookmarkCount: 1269,
            badge: 'string',
            readmeSummary: 'string',
        },
    ],
};

/** `UserPrivateInfo` */
export const user = {
    id: 'YiKoxjkaS9gjGTqhF',
    username: 'myusername',
    profile: {
        bio: 'I started web scraping in 1985 using Altair BASIC.',
        name: 'Jane Doe',
        pictureUrl: 'https://apify.com/img/anonymous_user_picture.png',
        githubUsername: 'torvalds.',
        websiteUrl: 'http://www.example.com',
        twitterUsername: '@BillGates',
    },
    email: 'bob@example.com',
    proxy: {
        password: 'ad78knd9Jkjd86',
        groups: [
            {
                name: 'Group1',
                description: 'Group1 description',
                availableCount: 10,
            },
        ],
    },
    plan: {
        id: 'Personal',
        description: 'Cost-effective plan for freelancers, developers and students.',
        isEnabled: true,
        monthlyBasePriceUsd: 49,
        monthlyUsageCreditsUsd: 49,
        usageDiscountPercent: 0,
        enabledPlatformFeatures: ['ACTORS', 'STORAGE', 'PROXY_SERPS', 'SCHEDULER', 'WEBHOOKS'],
        maxMonthlyUsageUsd: 9999,
        maxActorMemoryGbytes: 32,
        maxMonthlyActorComputeUnits: 1000,
        maxMonthlyResidentialProxyGbytes: 10,
        maxMonthlyProxySerps: 30000,
        maxMonthlyExternalDataTransferGbytes: 1000,
        maxActorCount: 100,
        maxActorTaskCount: 1000,
        dataRetentionDays: 14,
        availableProxyGroups: {
            key: 1,
        },
        teamAccountSeatCount: 1,
        supportLevel: 'COMMUNITY',
        availableAddOns: [],
        tier: 'FREE',
        apiRateLimitBoosts: 0,
        maxScheduleCount: 100,
        maxConcurrentActorRuns: 25,
        planPricing: {},
    },
    effectivePlatformFeatures: {
        ACTORS: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        STORAGE: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        SCHEDULER: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        PROXY: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        PROXY_EXTERNAL_ACCESS: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        PROXY_RESIDENTIAL: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        PROXY_SERPS: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        WEBHOOKS: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        ACTORS_PUBLIC_ALL: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
        ACTORS_PUBLIC_DEVELOPER: {
            isEnabled: true,
            disabledReason:
                'The "Selected public Actors for developers" feature is not enabled for your account. Please upgrade your plan or contact support@apify.com',
            disabledReasonType: 'DISABLED',
            isTrial: false,
            trialExpirationAt: '2025-01-01T14:00:00.000Z',
        },
    },
    createdAt: '2022-11-29T14:48:29.381Z',
    isPaying: true,
};

/** `MonthlyUsage` */
export const monthlyUsage = {
    usageCycle: {
        startAt: '2022-10-02T00:00:00.000Z',
        endAt: '2022-11-01T23:59:59.999Z',
    },
    monthlyServiceUsage: {
        key: {
            quantity: 2.784475,
            baseAmountUsd: 0.69611875,
            baseUnitPriceUsd: 0.25,
            amountAfterVolumeDiscountUsd: 0.69611875,
            priceTiers: [
                {
                    quantityAbove: 0,
                    discountPercent: 100,
                    tierQuantity: 0.39,
                    unitPriceUsd: 0,
                    priceUsd: 0,
                },
            ],
        },
    },
    dailyServiceUsages: [
        {
            date: '2022-10-02T00:00:00.000Z',
            serviceUsage: {
                key: {
                    quantity: 2.784475,
                    baseAmountUsd: 0.69611875,
                    baseUnitPriceUsd: 0.25,
                    amountAfterVolumeDiscountUsd: 0.69611875,
                    priceTiers: [
                        {
                            quantityAbove: 0,
                            discountPercent: 100,
                            tierQuantity: 0.39,
                            unitPriceUsd: 0,
                            priceUsd: 0,
                        },
                    ],
                },
            },
            totalUsageCreditsUsd: 0.0474385791970591,
        },
    ],
    totalUsageCreditsUsdBeforeVolumeDiscount: 0.786143673840067,
    totalUsageCreditsUsdAfterVolumeDiscount: 0.786143673840067,
};

/** `AccountLimits` */
export const accountLimits = {
    monthlyUsageCycle: {
        startAt: '2022-10-02T00:00:00.000Z',
        endAt: '2022-11-01T23:59:59.999Z',
    },
    limits: {
        maxMonthlyUsageUsd: 300,
        maxMonthlyActorComputeUnits: 1000,
        maxMonthlyExternalDataTransferGbytes: 7,
        maxMonthlyProxySerps: 50,
        maxMonthlyResidentialProxyGbytes: 0.5,
        maxActorMemoryGbytes: 16,
        maxActorCount: 100,
        maxActorTaskCount: 1000,
        maxConcurrentActorJobs: 256,
        maxTeamAccountSeatCount: 9,
        dataRetentionDays: 90,
        maxScheduleCount: 100,
    },
    current: {
        monthlyUsageUsd: 43,
        monthlyActorComputeUnits: 500.784475,
        monthlyExternalDataTransferGbytes: 3.00861903931946,
        monthlyProxySerps: 34,
        monthlyResidentialProxyGbytes: 0.4,
        actorMemoryGbytes: 8,
        actorCount: 31,
        actorTaskCount: 130,
        activeActorJobCount: 0,
        teamAccountSeatCount: 5,
        scheduleCount: 77,
    },
};
