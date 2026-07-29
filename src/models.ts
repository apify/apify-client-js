/**
 * Public models adapted from the generated OpenAPI types in `./generated/api`.
 *
 * The generated file is never re-exported directly. Every type here is declared on top of a generated
 * schema so the compiler reports drift, and the spec is adopted as-is wherever it is trustworthy. What
 * remains is deliberately small, and each deviation falls into exactly one of four kinds:
 *
 *   - `*SpecGaps` -- fields the API returns that the spec does not describe at all. Tracked upstream;
 *     each entry disappears from here as the spec catches up, and `./spec_guards` fails the build once
 *     one is filled.
 *   - `*SpecNarrowings` -- the spec is narrower than what the API actually returns, so the wider type is
 *     kept. Narrowing makes the compiler promise something that may be false, so it needs evidence;
 *     widening does not, and is adopted freely.
 *   - Re-pointing -- a generated schema references another generated schema, and the published model has
 *     to reference the adapted version instead so the adapted fields stay reachable.
 *   - Ecosystem decisions -- `@apify/consts` stays the source of truth for the enums it declares, and a
 *     published runtime enum cannot be swapped for a bare string union.
 *
 * Backward-compatibility shims are deliberately absent. This lands in the next major, so the spec's
 * nullability and optionality are adopted rather than papered over.
 */

import type { STORAGE_GENERAL_ACCESS, WEBHOOK_EVENT_TYPES } from '@apify/consts';

import type { components } from './generated/api';

type Schemas = components['schemas'];

// Every published model below is declared with `interface ... extends`, never as a type alias, even
// where an alias would read more directly. The docs plugin only emits API-reference pages for classes,
// interfaces and enums, so turning one of these into an alias silently deletes its page and leaves the
// methods that return it linking nowhere.

/**
 * Mirrors `WebhookEventType` from `./resource_clients/webhook`, derived from the same `@apify/consts`
 * source. It cannot be imported from there: `webhook.ts` reaches `webhook_dispatch.ts`, which imports
 * this module, and that would close an import cycle. `./spec_guards` asserts the two agree.
 */
type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES];

/**
 * Status of a webhook dispatch.
 *
 * Declared here rather than in `./resource_clients/webhook_dispatch` so that `WebhookDispatch` can
 * reference it without closing an import cycle. It is re-exported from there, so the public name and
 * import path are unchanged.
 */
export enum WebhookDispatchStatus {
    Active = 'ACTIVE',
    Succeeded = 'SUCCEEDED',
    Failed = 'FAILED',
}

/**
 * Fields the API returns on a dataset that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers them.
 */
export interface DatasetSpecGaps {
    title?: string;
    username?: string;
}

export interface DatasetSpecNarrowings {
    // Re-pointed at the adapted `DatasetStats` so its spec-gap fields stay reachable.
    stats?: DatasetStats;
    // Spec omits the `null` the API can return for a storage that follows the owner's user setting.
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
    // Spec lists `consoleUrl` as required, but the same `Dataset` schema backs both `GET /v2/datasets` and
    // `GET /v2/datasets/{datasetId}`, and its `required` array describes only the single-resource response.
    // The spec documents that split in prose rather than in the schema -- `DatasetStats.storageBytes` says
    // "Only returned by the single-dataset endpoint" and `inflatedBytes` "Only returned by the dataset list
    // endpoint" -- so a required `consoleUrl` would type-check and then be `undefined` for every item of
    // `datasets().list()`.
    consoleUrl?: string;
}

/**
 * Represents a dataset storage on the Apify platform.
 *
 * Datasets store structured data as a sequence of items (records). Each item is a JSON object.
 * Datasets are useful for storing results from web scraping, crawling, or data processing tasks.
 */
export interface Dataset
    extends Omit<Schemas['Dataset'], keyof DatasetSpecNarrowings>, DatasetSpecNarrowings, DatasetSpecGaps {}

/**
 * Fields the API returns in dataset stats that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers them.
 */
export interface DatasetStatsSpecGaps {
    deleteCount?: number;
}

/** An interface cannot extend an indexed access type directly, so each schema is named first. */
type GeneratedDatasetStats = Schemas['DatasetStats'];
type GeneratedDatasetFieldStatistics = Schemas['DatasetFieldStatistics'];
type GeneratedWebhookDispatchWebhookSummary = Schemas['WebhookDispatchWebhookSummary'];

// The spec inlines these two shapes into `WebhookDispatch` rather than naming them.
type GeneratedWebhookDispatchCall = NonNullable<Schemas['WebhookDispatch']['calls']>[number];
type GeneratedWebhookDispatchEventData = NonNullable<Schemas['WebhookDispatch']['eventData']>;

/** Statistics about dataset usage and storage. */
export interface DatasetStats extends GeneratedDatasetStats, DatasetStatsSpecGaps {}

export interface DatasetStatisticsRePointed {
    // Re-pointed so the published name stays `FieldStatistics` rather than the spec's
    // `DatasetFieldStatistics`. Structurally identical either way.
    /**
     * Statistics such as `min`, `max`, `nullCount` and `emptyCount` for each field of the dataset's
     * [fields schema](https://docs.apify.com/platform/actors/development/actor-definition/dataset-schema/validation).
     */
    fieldStatistics?: Record<string, FieldStatistics> | null;
}

/**
 * Statistical information about dataset fields.
 *
 * Provides insights into the data structure and content of the dataset.
 */
export interface DatasetStatistics
    extends Omit<Schemas['DatasetStatistics'], keyof DatasetStatisticsRePointed>, DatasetStatisticsRePointed {}

/** Statistics for a single field in a dataset. */
export interface FieldStatistics extends GeneratedDatasetFieldStatistics {}

/** The subset of a webhook that a dispatch carries. */
export interface WebhookDispatchWebhookSummary extends GeneratedWebhookDispatchWebhookSummary {}

export interface WebhookDispatchRePointed {
    // Re-pointed at the adapted equivalents of the shapes the spec inlines.
    calls?: WebhookDispatchCall[];
    webhook?: WebhookDispatchWebhookSummary | null;
    eventData?: WebhookDispatchEventData | null;
    // Sourced from `@apify/consts`, which the rest of the Apify JS ecosystem shares.
    eventType: WebhookEventType;
    // The client publishes a runtime enum, so the generated string union cannot be adopted as-is.
    status: WebhookDispatchStatus;
}

export interface WebhookDispatch
    extends Omit<Schemas['WebhookDispatch'], keyof WebhookDispatchRePointed>, WebhookDispatchRePointed {}

/** A single delivery attempt made by a webhook dispatch. */
export interface WebhookDispatchCall extends GeneratedWebhookDispatchCall {}

/** Identifiers of the resource whose event triggered a webhook. */
export interface WebhookDispatchEventData extends GeneratedWebhookDispatchEventData {}
