import { ApifyClient } from 'apify-client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type * as utils from '../src/utils.js';

// The fake API answers with bodies shaped for the iteration mechanics, not for the API's schemas, so the schema check
// the resource clients run on every response is skipped.
vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof utils>();
    return {
        ...actual,
        parseResponse: (response: { data: unknown }) => actual.pluckData(response.data as never),
    };
});

const RUN_ID = 'test-run-id';
const UNWIND_PARTS = 3;

interface Step {
    /** Total number of rows in the dataset, readable right away. */
    pushedRows: number;
    /** The dataset's `itemCount`, which lags behind the pushed rows. */
    itemCount: number;
    status: string;
}

interface Shaping {
    clean?: boolean;
    unwind?: boolean;
}

const range = (start: number, end: number) => Array.from({ length: Math.max(end - start, 0) }, (_, i) => start + i);

/**
 * Turns dataset rows into items: `clean` drops every odd row, `unwind` splits a row into `UNWIND_PARTS` items and
 * drops every third row, whose unwound field is an empty array.
 */
const shapeItems = (rows: number[], { clean = false, unwind = false }: Shaping = {}) => {
    const keptRows = rows.filter((row) => !(clean && row % 2) && !(unwind && row % 3 === 2));
    if (unwind) return keptRows.flatMap((row) => range(0, UNWIND_PARTS).map((part) => ({ row, part })));
    return keptRows.map((row) => ({ row }));
};

/**
 * Fakes the run, run dataset and dataset items endpoints, advanced by one `Step` per run status read. The items
 * endpoint scans exactly `limit` rows from `offset`, like the real one, and derives the count from `itemCount`.
 */
const mockRunApi = (client: ApifyClient, steps: Step[]) => {
    let stepIndex = -1;
    const step = () => steps[Math.max(stepIndex, 0)];

    const spy = vi.spyOn(client.httpClient, 'call').mockImplementation((async (request: any) => {
        const url: string = request.url;
        if (url.endsWith(`/actor-runs/${RUN_ID}`)) {
            stepIndex = Math.min(stepIndex + 1, steps.length - 1);
            return { data: { data: { id: RUN_ID, status: step().status } } };
        }
        if (url.endsWith(`/actor-runs/${RUN_ID}/dataset`)) {
            return { data: { data: { id: 'test-dataset-id', itemCount: step().itemCount } } };
        }
        if (url.endsWith(`/actor-runs/${RUN_ID}/dataset/items`)) {
            const offset: number = request.params.offset ?? 0;
            const limit: number = request.params.limit || 999_999_999_999;
            const rows = range(offset, Math.min(offset + limit, step().pushedRows));
            return {
                data: shapeItems(rows, { clean: request.params.clean, unwind: Boolean(request.params.unwind) }),
                headers: {
                    'x-apify-pagination-total': String(step().itemCount),
                    'x-apify-pagination-offset': String(offset),
                    'x-apify-pagination-count': String(Math.max(Math.min(step().itemCount - offset, limit), 0)),
                    'x-apify-pagination-limit': String(limit),
                    'x-apify-pagination-desc': 'false',
                },
            };
        }
        throw new Error(`Unexpected request to ${url}`);
    }) as any);

    return { spy, step };
};

const LAGGING_RUN_STEPS: Step[] = [
    { pushedRows: 3, itemCount: 0, status: 'READY' },
    { pushedRows: 40, itemCount: 3, status: 'RUNNING' },
    { pushedRows: 52, itemCount: 25, status: 'RUNNING' },
    // The run has finished, but `itemCount` still lags more than one page behind the readable rows.
    { pushedRows: 75, itemCount: 52, status: 'SUCCEEDED' },
];

const collect = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
    const items: T[] = [];
    for await (const item of iterable) items.push(item);
    return items;
};

describe('RunClient.iterateDatasetItems', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('yields rows pushed across polls and past a lagging item count after the run finished, in order', async () => {
        const client = new ApifyClient();
        mockRunApi(client, LAGGING_RUN_STEPS);

        const items = await collect(client.run(RUN_ID).iterateDatasetItems({ chunkSize: 10, pollIntervalSecs: 0 }));

        expect(items).toEqual(shapeItems(range(0, 75)));
    });

    test.each([
        { name: 'clean drops items, partly filtered pages', shaping: { clean: true }, chunkSize: 10 },
        { name: 'clean drops items, fully filtered pages', shaping: { clean: true }, chunkSize: 1 },
        { name: 'unwind multiplies or drops items, partly filtered pages', shaping: { unwind: true }, chunkSize: 10 },
        { name: 'unwind multiplies or drops items, fully filtered pages', shaping: { unwind: true }, chunkSize: 1 },
    ])('filters and unwind neither duplicate nor skip rows ($name)', async ({ shaping, chunkSize }) => {
        const client = new ApifyClient();
        mockRunApi(client, LAGGING_RUN_STEPS);

        const items = await collect(
            client.run(RUN_ID).iterateDatasetItems({
                clean: shaping.clean,
                unwind: shaping.unwind ? ['parts'] : undefined,
                chunkSize,
                pollIntervalSecs: 0,
            }),
        );

        expect(items).toEqual(shapeItems(range(0, 75), shaping));
    });

    test.each(['ABORTING', 'TIMING-OUT'])('keeps polling through %s until a terminal status', async (status) => {
        const client = new ApifyClient();
        mockRunApi(client, [
            { pushedRows: 5, itemCount: 5, status },
            { pushedRows: 8, itemCount: 8, status: 'ABORTED' },
        ]);

        const items = await collect(client.run(RUN_ID).iterateDatasetItems({ pollIntervalSecs: 0 }));

        expect(items).toEqual(shapeItems(range(0, 8)));
    });

    test('starts at offset and stops once limit rows are scanned, without waiting for the run to finish', async () => {
        const client = new ApifyClient();
        const { step } = mockRunApi(client, [
            { pushedRows: 4, itemCount: 4, status: 'RUNNING' },
            { pushedRows: 20, itemCount: 20, status: 'RUNNING' },
        ]);

        const items = await collect(
            client.run(RUN_ID).iterateDatasetItems({ offset: 2, limit: 7, chunkSize: 3, pollIntervalSecs: 0 }),
        );

        expect(items).toEqual(shapeItems(range(2, 9)));
        expect(step().status).toBe('RUNNING');
    });

    test('a limit ending past a lagging item count stops reading after the run finished', async () => {
        const client = new ApifyClient();
        mockRunApi(client, LAGGING_RUN_STEPS);

        const items = await collect(
            client.run(RUN_ID).iterateDatasetItems({ limit: 60, chunkSize: 10, pollIntervalSecs: 0 }),
        );

        expect(items).toEqual(shapeItems(range(0, 60)));
    });

    test('waits pollIntervalSecs after each poll of an unfinished run and not after the final one', async () => {
        const client = new ApifyClient();
        mockRunApi(client, LAGGING_RUN_STEPS);
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
            callback();
            return 0;
        }) as any);

        await collect(client.run(RUN_ID).iterateDatasetItems({ pollIntervalSecs: 2 }));

        expect(setTimeoutSpy.mock.calls.map(([, delay]) => delay)).toEqual([2000, 2000, 2000]);
    });

    test('rejects unknown options', async () => {
        const client = new ApifyClient();

        await expect(collect(client.run(RUN_ID).iterateDatasetItems({ desc: true } as any))).rejects.toThrow();
    });
});
