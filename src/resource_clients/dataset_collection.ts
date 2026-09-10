import { z } from 'zod';

import { STORAGE_OWNERSHIP_FILTER } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client.js';
import { ResourceCollectionClient } from '../base/resource_collection_client.js';
import type { TimeoutOptions } from '../timeouts.js';
import type { PaginatedList, PaginationOptions } from '../utils.js';
import * as schemas from '../schemas.js';
import { optionalTimeoutSchema, timeoutOptionsShape } from '../timeouts.js';
import { anyObjectSchema, paginationOptionsShape, parseArgument } from '../utils.js';
import type { Dataset } from './dataset.js';

const listOptionsSchema = z.strictObject({
    unnamed: z.boolean().optional(),
    ...paginationOptionsShape,
    desc: z.boolean().optional(),
    ownership: z.enum(STORAGE_OWNERSHIP_FILTER).optional(),
    ...timeoutOptionsShape,
});
const nameSchema = z.string().optional();
const schemaSchema = anyObjectSchema.optional();

/**
 * Client for managing the collection of datasets in your account.
 *
 * Datasets store structured data results from Actor runs. This client provides methods
 * to list, create, or get datasets by name.
 *
 * @example
 * ```javascript
 * const client = new ApifyClient({ token: 'my-token' });
 * const datasetsClient = client.datasets();
 *
 * // List all datasets
 * const { items } = await datasetsClient.list();
 *
 * // Get or create a dataset by name
 * const dataset = await datasetsClient.getOrCreate('my-dataset');
 * ```
 *
 * @see https://docs.apify.com/platform/storage/dataset
 */
export class DatasetCollectionClient extends ResourceCollectionClient {
    /**
     * @hidden
     */
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'datasets',
            ...options,
        });
    }

    /**
     * Lists all Datasets.
     *
     * Awaiting the return value (as you would with a Promise) will result in a single API call. The amount of fetched
     * items in a single API call is limited.
     * ```javascript
     * const paginatedList = await client.list(options);
     * ```
     *
     * Asynchronous iteration is also supported. This will fetch additional pages if needed until all items are
     * retrieved.
     *
     * ```javascript
     * for await (const singleItem of client.list(options)) {...}
     * ```
     *
     * @param options - Pagination options.
     * @param options.timeout - Timeout for each API request. Default is `'medium'`.
     * @returns A paginated iterator of Datasets.
     * @see https://docs.apify.com/api/v2/datasets-get
     */
    list(
        options: DatasetCollectionClientListOptions = {},
    ): Promise<DatasetCollectionClientListResult> & AsyncIterable<Dataset> {
        const parsed = parseArgument(options, listOptionsSchema, 'DatasetCollectionClientListOptions');

        return this._listPaginated(schemas.ListOfDatasets(), parsed, 'medium');
    }

    /**
     * Gets or creates a dataset with the specified name.
     *
     * @param name - Name of the dataset. If not provided, a default dataset is used.
     * @param options - Additional options like schema.
     * @param options.schema - Schema of the dataset.
     * @param options.timeout - Timeout for the API request. Default is `'short'`.
     * @returns The dataset object.
     * @see https://docs.apify.com/api/v2/datasets-post
     */
    async getOrCreate(name?: string, options?: DatasetCollectionClientGetOrCreateOptions): Promise<Dataset> {
        parseArgument(name, nameSchema);
        parseArgument(options?.schema, schemaSchema); // TODO: Add schema validation
        parseArgument(options?.timeout, optionalTimeoutSchema);

        // `timeout` is not part of the resource, so the body carries only the rest, and stays absent when
        // there is nothing else to send.
        const { timeout = 'short', ...resource } = options ?? {};
        const hasResource = Object.keys(resource).length > 0;

        return this._getOrCreate(schemas.Dataset(), name, hasResource ? resource : undefined, timeout);
    }
}

export interface DatasetCollectionClientListOptions extends PaginationOptions, TimeoutOptions {
    unnamed?: boolean;
    desc?: boolean;
    /**
     * Filter by ownership: 'ownedByMe' returns only user's own datasets, 'sharedWithMe' returns only shared datasets.
     * @since Added in 2.22.1
     */
    ownership?: STORAGE_OWNERSHIP_FILTER;
}

/**
 * @since Added in 2.3.0
 */
export interface DatasetCollectionClientGetOrCreateOptions extends TimeoutOptions {
    schema?: Record<string, unknown>;
}

export type DatasetCollectionClientListResult = PaginatedList<Dataset> & { unnamed: boolean };
