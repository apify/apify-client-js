import { z } from 'zod';

import { STORAGE_OWNERSHIP_FILTER } from '@apify/consts';

import type { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import type { PaginatedList, PaginationOptions } from '../utils';
import { anyObjectSchema, validate } from '../utils';
import type { Dataset } from './dataset';

const listOptionsSchema = z
    .object({
        unnamed: z.boolean().optional(),
        limit: z.number().min(0).optional(),
        offset: z.number().min(0).optional(),
        desc: z.boolean().optional(),
        ownership: z.nativeEnum(STORAGE_OWNERSHIP_FILTER).optional(),
    })
    .strict();
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
     * @returns A paginated iterator of Datasets.
     * @see https://docs.apify.com/api/v2/datasets-get
     */
    list(
        options: DatasetCollectionClientListOptions = {},
    ): Promise<DatasetCollectionClientListResult> & AsyncIterable<Dataset> {
        validate(listOptionsSchema, options);

        return this._listPaginated(options);
    }

    /**
     * Gets or creates a dataset with the specified name.
     *
     * @param name - Name of the dataset. If not provided, a default dataset is used.
     * @param options - Additional options like schema.
     * @returns The dataset object.
     * @see https://docs.apify.com/api/v2/datasets-post
     */
    async getOrCreate(name?: string, options?: DatasetCollectionClientGetOrCreateOptions): Promise<Dataset> {
        validate(nameSchema, name);
        validate(schemaSchema, options?.schema); // TODO: Add schema validation

        return this._getOrCreate(name, options);
    }
}

export interface DatasetCollectionClientListOptions extends PaginationOptions {
    unnamed?: boolean;
    desc?: boolean;
    /** Filter by ownership: 'ownedByMe' returns only user's own datasets, 'sharedWithMe' returns only shared datasets. */
    ownership?: STORAGE_OWNERSHIP_FILTER;
}

export interface DatasetCollectionClientGetOrCreateOptions {
    schema?: Record<string, unknown>;
}

export type DatasetCollectionClientListResult = PaginatedList<Dataset> & { unnamed: boolean };
