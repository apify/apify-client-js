/**
 * Public models adapted from the generated OpenAPI types in `./generated/api`.
 *
 * The generated file is never re-exported directly. Every type here is declared on top of a generated
 * schema so the compiler reports drift, and the spec is adopted as-is wherever it is trustworthy. What
 * remains is deliberately small, and each deviation falls into exactly one of five kinds, one block per
 * kind per schema:
 *
 *   - `*SpecGaps` -- fields the API returns that the spec does not describe at all. Tracked upstream;
 *     each entry disappears from here as the spec catches up, and `./spec_guards` fails the build once
 *     one is filled.
 *   - `*SpecNarrowings` -- the spec is narrower than what the API actually returns, so the wider type is
 *     kept. Widening needs no evidence and is adopted freely.
 *   - `*ClientNarrowings` -- the published type is narrower than the spec on purpose. This makes the
 *     compiler promise something the spec does not, so every entry carries its evidence.
 *   - `*ClientConversions` -- the client rewrites the value before the caller sees it, so the published
 *     type is the converted one rather than the wire type the spec describes.
 *   - `*RePointed` -- the field's type is replaced by a name this package owns: an adapted model, a
 *     `@apify/consts` union, or a published runtime enum. Left alone, the reference would render the
 *     generated schema as an indexed access into `./generated/api`, adapted fields on it would be
 *     unreachable, and a string union would replace an enum callers compare against.
 *
 * Backward-compatibility shims are deliberately absent. This lands in the next major, so the spec's
 * nullability and optionality are adopted rather than papered over.
 */

import type {
    ACTOR_JOB_STATUSES,
    ACTOR_PERMISSION_LEVEL,
    META_ORIGINS,
    RUN_GENERAL_ACCESS,
    STORAGE_GENERAL_ACCESS,
    ValueOf,
    WEBHOOK_EVENT_TYPES,
} from '@apify/consts';

import type { components } from './generated/api.js';
import type { Timezone } from './timezones.js';
import type { Dictionary } from './utils.js';

type Schemas = components['schemas'];

// Every published model below is declared with `interface ... extends`, never as a type alias, even
// where an alias would read more directly. The docs plugin only emits API-reference pages for classes,
// interfaces and enums, so turning one of these into an alias silently deletes its page and leaves the
// methods that return it linking nowhere.

/**
 * Event types that can trigger webhooks.
 *
 * Declared here rather than in `./resource_clients/webhook` so that both `Webhook` and
 * `WebhookDispatch` can reference it without closing an import cycle. It is re-exported from there, so
 * the public name and import path are unchanged.
 */
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES];

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

export interface DatasetRePointed {
    stats?: DatasetStats;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

export interface DatasetSpecNarrowings {
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
    extends
        Omit<Schemas['Dataset'], keyof DatasetRePointed | keyof DatasetSpecNarrowings>,
        DatasetRePointed,
        DatasetSpecNarrowings,
        DatasetSpecGaps {}

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

// The spec inlines these two shapes into `WebhookDispatch` rather than naming them.
type GeneratedWebhookDispatchCall = NonNullable<Schemas['WebhookDispatch']['calls']>[number];
type GeneratedWebhookDispatchEventData = NonNullable<Schemas['WebhookDispatch']['eventData']>;

/** Statistics about dataset usage and storage. */
export interface DatasetStats extends GeneratedDatasetStats, DatasetStatsSpecGaps {}

export interface DatasetStatisticsRePointed {
    // The published name stays `FieldStatistics` rather than the spec's `DatasetFieldStatistics`.
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
 * @since Added in 2.11.2
 */
export interface DatasetStatistics
    extends Omit<Schemas['DatasetStatistics'], keyof DatasetStatisticsRePointed>, DatasetStatisticsRePointed {}

/**
 * Statistics for a single field in a dataset.
 * @since Added in 2.11.2
 */
export interface FieldStatistics extends GeneratedDatasetFieldStatistics {}

export interface WebhookDispatchWebhookSummaryRePointed {
    // The published union of single-id variants, the same type `Webhook.condition` carries. Left alone,
    // one concept would have two published shapes and this one would render as an indexed access into
    // the generated file.
    condition?: WebhookCondition;
}

/** The subset of a webhook that a dispatch carries. */
export interface WebhookDispatchWebhookSummary
    extends
        Omit<Schemas['WebhookDispatchWebhookSummary'], keyof WebhookDispatchWebhookSummaryRePointed>,
        WebhookDispatchWebhookSummaryRePointed {}

export interface WebhookDispatchRePointed {
    calls?: WebhookDispatchCall[];
    webhook?: WebhookDispatchWebhookSummary | null;
    eventData?: WebhookDispatchEventData | null;
    eventType: WebhookEventType;
    status: WebhookDispatchStatus;
}

export interface WebhookDispatch
    extends Omit<Schemas['WebhookDispatch'], keyof WebhookDispatchRePointed>, WebhookDispatchRePointed {}

/** A single delivery attempt made by a webhook dispatch. */
export interface WebhookDispatchCall extends GeneratedWebhookDispatchCall {}

/**
 * Identifiers of the resource whose event triggered a webhook.
 * @since Added in 2.13.0
 */
export interface WebhookDispatchEventData extends GeneratedWebhookDispatchEventData {}

type GeneratedKeyValueStoreStats = Schemas['KeyValueStoreStats'];
type GeneratedKeyValueStoreKey = Schemas['KeyValueStoreKey'];

/**
 * Fields the API returns on a key-value store that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers them.
 */
export interface KeyValueStoreSpecGaps {
    title?: string;
}

export interface KeyValueStoreRePointed {
    stats?: KeyValueStoreStats;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

/**
 * Represents a Key-Value Store storage on the Apify platform.
 *
 * Key-value stores are used to store arbitrary data records or files. Each record is identified
 * by a unique key and can contain any data - JSON objects, strings, binary files, etc.
 */
export interface KeyValueStore
    extends
        Omit<Schemas['KeyValueStore'], keyof KeyValueStoreRePointed>,
        KeyValueStoreRePointed,
        KeyValueStoreSpecGaps {}

/** Statistics about Key-Value Store usage and storage. */
export interface KeyValueStoreStats extends GeneratedKeyValueStoreStats {}

/** Metadata about a single key in a Key-Value Store. */
export interface KeyValueListItem extends GeneratedKeyValueStoreKey {}

export interface KeyValueClientListKeysResultRePointed {
    // `KeyValueListItem` is the name this client has always used for the spec's `KeyValueStoreKey`.
    items: KeyValueListItem[];
}

/**
 * Result of listing keys in a Key-Value Store.
 *
 * Contains paginated list of keys with metadata and pagination information.
 */
export interface KeyValueClientListKeysResult
    extends
        Omit<Schemas['ListOfKeys'], keyof KeyValueClientListKeysResultRePointed>,
        KeyValueClientListKeysResultRePointed {}

type GeneratedVersion = Schemas['Version'];
type GeneratedSourceCodeFile = Schemas['SourceCodeFile'];
type GeneratedSourceCodeFolder = Schemas['SourceCodeFolder'];
type GeneratedEnvVar = Schemas['EnvVar'];

/**
 * Where the source code of an Actor version lives.
 *
 * Declared here rather than in `./resource_clients/actor_version` so that the version types can
 * reference it without closing an import cycle. It is re-exported from there, so the public name and
 * import path are unchanged.
 */
export enum ActorSourceType {
    SourceFiles = 'SOURCE_FILES',
    GitRepo = 'GIT_REPO',
    Tarball = 'TARBALL',
    GitHubGist = 'GITHUB_GIST',
    SourceCode = 'SOURCE_CODE',
}

/** An environment variable of an Actor version. */
export interface ActorEnvironmentVariable extends GeneratedEnvVar {}

/** A single file of an Actor version's source code. */
export interface ActorVersionSourceFile extends GeneratedSourceCodeFile {}

/**
 * A folder in an Actor version's source code tree.
 *
 * `sourceFiles` is a flat list that mixes files and folders, told apart by this shape's `folder` flag
 * rather than by nesting.
 */
export interface ActorVersionSourceFolder extends GeneratedSourceCodeFolder {}

/**
 * The four fields that hold a version's source location, exactly one of which applies per source
 * type. The spec marks all of them optional on a single flat schema; each union variant below
 * reinstates the one that its `sourceType` implies, as required.
 */
export type ActorVersionSourceLocation = 'sourceFiles' | 'gitRepoUrl' | 'tarballUrl' | 'gitHubGistUrl';

export interface ActorVersionRePointed {
    envVars?: ActorEnvironmentVariable[] | null;
}

export interface ActorVersionClientNarrowings {
    // The spec permits `sourceType: null`. It is deliberately not adopted: the published type is a
    // union discriminated on exactly this field, and a version with no source type carries no usable
    // source location either, so accepting the `null` would only make every variant unreachable.
    sourceType: ActorSourceType;
}

/**
 * Fields every Actor version carries, whatever its source type.
 *
 * The spec models a version as one flat object with all four source locations optional. This client
 * keeps a union discriminated on `sourceType` instead, because that narrows the source location down
 * to the single field which applies -- so the four are dropped here and reinstated per variant.
 */
export interface BaseActorVersion<SourceType extends ActorSourceType>
    extends
        Omit<
            GeneratedVersion,
            keyof ActorVersionClientNarrowings | keyof ActorVersionRePointed | ActorVersionSourceLocation
        >,
        ActorVersionRePointed {
    sourceType: SourceType;
}

/**
 * An Actor version whose source code is stored on the Apify platform.
 * @since Added in 2.6.1
 */
export interface ActorVersionSourceFiles extends BaseActorVersion<ActorSourceType.SourceFiles> {
    sourceFiles: (ActorVersionSourceFile | ActorVersionSourceFolder)[];
}

/** An Actor version built from a Git repository. */
export interface ActorVersionGitRepo extends BaseActorVersion<ActorSourceType.GitRepo> {
    gitRepoUrl: NonNullable<GeneratedVersion['gitRepoUrl']>;
}

/** An Actor version built from a downloadable tarball or ZIP archive. */
export interface ActorVersionTarball extends BaseActorVersion<ActorSourceType.Tarball> {
    tarballUrl: NonNullable<GeneratedVersion['tarballUrl']>;
}

/** An Actor version built from a GitHub Gist. */
export interface ActorVersionGitHubGist extends BaseActorVersion<ActorSourceType.GitHubGist> {
    gitHubGistUrl: NonNullable<GeneratedVersion['gitHubGistUrl']>;
}

/**
 * An Actor version whose source is a single inline script.
 *
 * It carries no source location of its own, so it adds nothing to `BaseActorVersion`; the variant
 * exists so that `SOURCE_CODE`, which both the spec and `@apify/consts` list, is representable.
 */
export interface ActorVersionSourceCode extends BaseActorVersion<ActorSourceType.SourceCode> {}

/** A version of an Actor, discriminated on where its source code comes from. */
export type ActorVersion =
    | ActorVersionSourceFiles
    | ActorVersionGitRepo
    | ActorVersionTarball
    | ActorVersionGitHubGist
    | ActorVersionSourceCode;

/**
 * An Actor version as the API returns it, where the build tag is always set.
 *
 * `Required` would not be enough: it strips `undefined` but leaves the `null` the spec allows on
 * `buildTag`, so a caller would still have to null-check a field this type promises is set. It is
 * unwrapped with `NonNullable` instead.
 */
export type FinalActorVersion = ActorVersion & {
    buildTag: NonNullable<ActorVersion['buildTag']>;
};

type GeneratedActorStats = Schemas['ActorStats'];
type GeneratedActorStandby = Schemas['ActorStandby'];
type GeneratedExampleRunInput = Schemas['ExampleRunInput'];
type GeneratedTaggedBuildInfo = Schemas['TaggedBuildInfo'];
type GeneratedFreeActorPricingInfo = Schemas['FreeActorPricingInfo'];
type GeneratedFlatPricePerMonthActorPricingInfo = Schemas['FlatPricePerMonthActorPricingInfo'];
type GeneratedTieredPricingPerDatasetItemEntry = Schemas['TieredPricingPerDatasetItemEntry'];
type GeneratedTieredPricingPerEventEntry = Schemas['TieredPricingPerEventEntry'];

/** Statistics about Actor usage and activity. */
export interface ActorStats extends GeneratedActorStats {}

/**
 * Standby mode configuration, for keeping an Actor warm and responsive.
 * @since Added in 2.9.5
 */
export interface ActorStandby extends GeneratedActorStandby {}

/** Example input data to demonstrate Actor usage. */
export interface ActorExampleRunInput extends GeneratedExampleRunInput {}

/** Information about a specific tagged build. */
export interface ActorTaggedBuild extends GeneratedTaggedBuildInfo {}

/** Mapping of build tags (e.g. 'latest', 'beta') to their corresponding build information. */
export type ActorTaggedBuilds = Record<string, ActorTaggedBuild | null>;

export interface ActorDefaultRunOptionsRePointed {
    forcePermissionLevel?: ACTOR_PERMISSION_LEVEL | null;
}

/** Default configuration options for Actor runs. */
export interface ActorDefaultRunOptions
    extends
        Omit<Schemas['DefaultRunOptions'], keyof ActorDefaultRunOptionsRePointed>,
        ActorDefaultRunOptionsRePointed {}

/**
 * Fields of an Actor definition that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers them.
 */
export interface ActorDefinitionSpecGaps {
    /**
     * Output schema for the Actor.
     *
     * @see https://docs.apify.com/platform/actors/development/actor-definition/output-schema
     */
    output?: object | null;
}

type GeneratedActorDefinition = Schemas['ActorDefinition'];

/**
 * Actor definition from the `.actor/actor.json` file.
 *
 * Contains the Actor's configuration, input schema, and other metadata.
 * @see https://docs.apify.com/platform/actors/development/actor-definition/actor-json
 * @since Added in 2.11.0
 */
export interface ActorDefinition extends GeneratedActorDefinition, ActorDefinitionSpecGaps {}

export interface ActorChargeEventRePointed {
    eventTieredPricingUsd?: TieredPricingPerEvent;
}

/**
 * Definition of a chargeable event for pay-per-event Actors.
 * @since Added in 2.11.1
 */
export interface ActorChargeEvent
    extends Omit<Schemas['ActorChargeEvent'], keyof ActorChargeEventRePointed>, ActorChargeEventRePointed {}

/**
 * Mapping of event names to their pricing information.
 * @since Added in 2.11.1
 */
export type ActorChargeEvents = Record<string, ActorChargeEvent>;

/**
 * Pricing information for free Actors.
 * @since Added in 2.11.1
 */
export interface FreeActorPricingInfo extends GeneratedFreeActorPricingInfo {}

/**
 * Pricing information for Actors with a flat monthly subscription fee.
 * @since Added in 2.11.1
 */
export interface FlatPricePerMonthActorPricingInfo extends GeneratedFlatPricePerMonthActorPricingInfo {}

export interface PricePerDatasetItemActorPricingInfoRePointed {
    tieredPricing?: TieredPricingPerDatasetItem;
}

/**
 * Pricing information for pay-per-result Actors.
 *
 * These Actors charge based on the number of items saved to the dataset.
 * @since Added in 2.11.1
 */
export interface PricePerDatasetItemActorPricingInfo
    extends
        Omit<Schemas['PricePerDatasetItemActorPricingInfo'], keyof PricePerDatasetItemActorPricingInfoRePointed>,
        PricePerDatasetItemActorPricingInfoRePointed {}

export interface PricePerEventActorPricingInfoRePointed {
    pricingPerEvent: {
        actorChargeEvents?: ActorChargeEvents;
    };
}

/**
 * Pricing information for pay-per-event Actors.
 *
 * These Actors charge based on specific events (e.g., emails sent, API calls made). The spec names
 * this schema `PayPerEventActorPricingInfo`; the published name is kept as it is.
 * @since Added in 2.11.1
 */
export interface PricePerEventActorPricingInfo
    extends
        Omit<Schemas['PayPerEventActorPricingInfo'], keyof PricePerEventActorPricingInfoRePointed>,
        PricePerEventActorPricingInfoRePointed {}

/**
 * Union type representing all possible Actor pricing models.
 * @since Added in 2.11.1
 */
export type ActorRunPricingInfo =
    | PricePerEventActorPricingInfo
    | PricePerDatasetItemActorPricingInfo
    | FlatPricePerMonthActorPricingInfo
    | FreeActorPricingInfo;

/** One subscription tier's price per dataset item. */
export interface TieredPricingPerDatasetItemEntry extends GeneratedTieredPricingPerDatasetItemEntry {}

/** One subscription tier's price for a single charge event. */
export interface TieredPricingPerEventEntry extends GeneratedTieredPricingPerEventEntry {}

/**
 * Tiered price-per-dataset-item pricing, keyed by subscription tier such as `FREE` or `GOLD`.
 *
 * The spec models both tiered maps as index signatures over an entry schema, and the entry is what a
 * caller reads, so it is published in its own right and the map points at it.
 */
export interface TieredPricingPerDatasetItem {
    [tier: string]: TieredPricingPerDatasetItemEntry;
}

/** Tiered pay-per-event pricing, keyed by subscription tier such as `FREE` or `GOLD`. */
export interface TieredPricingPerEvent {
    [tier: string]: TieredPricingPerEventEntry;
}

/**
 * Fields the API returns on an Actor that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers them.
 */
export interface ActorSpecGaps {
    /** Whether the Actor can be run by anonymous users without authentication */
    isAnonymouslyRunnable?: boolean;
}

export interface ActorRePointed {
    stats: ActorStats;
    versions: ActorVersion[];
    pricingInfos?: ActorRunPricingInfo[];
    defaultRunOptions: ActorDefaultRunOptions;
    exampleRunInput?: ActorExampleRunInput | null;
    taggedBuilds?: ActorTaggedBuilds | null;
    actorStandby?: ActorStandby | null;
    actorPermissionLevel?: ACTOR_PERMISSION_LEVEL;
}

/**
 * Represents an Actor in the Apify platform.
 *
 * Actors are serverless computing units that can perform arbitrary tasks such as web scraping,
 * data processing, automation, and more. Each Actor has versions, builds, and can be executed
 * with different configurations.
 */
export interface Actor extends Omit<Schemas['Actor'], keyof ActorRePointed>, ActorRePointed, ActorSpecGaps {}

export interface ActorCollectionListItemRePointed {
    stats?: ActorStats | null;
}

/** An Actor as it appears in a listing, which carries fewer fields than the full resource. */
export interface ActorCollectionListItem
    extends Omit<Schemas['ActorShort'], keyof ActorCollectionListItemRePointed>, ActorCollectionListItemRePointed {}

type GeneratedBuildUsage = Schemas['BuildUsage'];
type GeneratedBuildStats = Schemas['BuildStats'];
type GeneratedBuildOptions = Schemas['BuildOptions'];

/**
 * Resource usage for an Actor build.
 * @since Added in 2.7.2
 */
export interface BuildUsage extends GeneratedBuildUsage {}

/** Runtime statistics for an Actor build. */
export interface BuildStats extends GeneratedBuildStats {}

/** Configuration options used for an Actor build. */
export interface BuildOptions extends GeneratedBuildOptions {}

export interface BuildMetaRePointed {
    origin: ValueOf<typeof META_ORIGINS>;
}

/**
 * Metadata about how a Build was initiated.
 *
 * The spec names this schema `BuildsMeta`; the published name is kept as it is.
 */
export interface BuildMeta extends Omit<Schemas['BuildsMeta'], keyof BuildMetaRePointed>, BuildMetaRePointed {}

export interface BuildRePointed {
    meta: BuildMeta;
    stats?: BuildStats | null;
    options?: BuildOptions | null;
    usage?: BuildUsage | null;
    usageUsd?: BuildUsage | null;
    actorDefinition?: ActorDefinition | null;
    status: ValueOf<typeof ACTOR_JOB_STATUSES>;
}

/**
 * Represents an Actor build.
 *
 * Builds compile Actor source code and prepare it for execution. Each build has a unique ID
 * and can be tagged (e.g., 'latest', 'beta') for easy reference.
 */
export interface Build extends Omit<Schemas['Build'], keyof BuildRePointed>, BuildRePointed {}

export interface BuildCollectionClientListItemRePointed {
    meta?: BuildMeta;
    status: ValueOf<typeof ACTOR_JOB_STATUSES>;
}

/** A build as it appears in a listing, which carries fewer fields than the full resource. */
export interface BuildCollectionClientListItem
    extends
        Omit<Schemas['BuildShort'], keyof BuildCollectionClientListItemRePointed>,
        BuildCollectionClientListItemRePointed {}

type GeneratedRunUsage = Schemas['RunUsage'];
type GeneratedRunStats = Schemas['RunStats'];
type GeneratedRunOptions = Schemas['RunOptions'];
type GeneratedMetamorph = Schemas['Metamorph'];

// The spec inlines the storage-id map into `Run` rather than naming it.
type GeneratedRunStorageIds = NonNullable<Schemas['Run']['storageIds']>;

/**
 * Resource usage metrics for an Actor run.
 *
 * All values represent the total consumption during the run's lifetime. The same shape doubles as the
 * cost breakdown on `ActorRun.usageUsd`, where the spec names it `RunUsageUsd`; the two are
 * structurally identical, so the published type stays single.
 * @since Added in 2.7.0
 */
export interface ActorRunUsage extends GeneratedRunUsage {}

/**
 * Runtime statistics for an Actor run.
 *
 * Provides detailed metrics about resource consumption and performance during the run.
 */
export interface ActorRunStats extends GeneratedRunStats {}

/** A metamorph event that occurred during an Actor run. */
export interface ActorRunMetamorph extends GeneratedMetamorph {}

/**
 * Aliased storage IDs associated with an Actor run, grouped by storage type.
 *
 * Each group is a map from alias to storage ID. The spec describes no alias as guaranteed, not even
 * `default`, so a lookup can come back `undefined`.
 * @since Added in 2.22.3
 */
export interface ActorRunStorageIds extends GeneratedRunStorageIds {}

export interface ActorRunMetaRePointed {
    origin: ValueOf<typeof META_ORIGINS>;
}

/** Metadata about how an Actor run was initiated. */
export interface ActorRunMeta extends Omit<Schemas['RunMeta'], keyof ActorRunMetaRePointed>, ActorRunMetaRePointed {}

/**
 * Fields the API returns in an Actor run's options that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers it.
 */
export interface ActorRunOptionsSpecGaps {
    restartOnError?: boolean;
}

/**
 * Configuration options used for an Actor run.
 *
 * These are the actual options that were applied to the run (may differ from requested options).
 */
export interface ActorRunOptions extends GeneratedRunOptions, ActorRunOptionsSpecGaps {}

export interface ActorRunListItemRePointed {
    meta: ActorRunMeta;
    status: ValueOf<typeof ACTOR_JOB_STATUSES>;
}

/**
 * An Actor run as it appears in a listing, which carries fewer fields than the full resource.
 * @since Added in 2.7.0
 */
export interface ActorRunListItem
    extends Omit<Schemas['RunShort'], keyof ActorRunListItemRePointed>, ActorRunListItemRePointed {}

export interface ActorRunRePointed {
    meta: ActorRunMeta;
    stats: ActorRunStats;
    options: ActorRunOptions;
    usage?: ActorRunUsage | null;
    usageUsd?: ActorRunUsage | null;
    storageIds?: ActorRunStorageIds;
    metamorphs?: ActorRunMetamorph[] | null;
    pricingInfo?: ActorRunPricingInfo;
    status: ValueOf<typeof ACTOR_JOB_STATUSES>;
}

export interface ActorRunClientNarrowings {
    // The spec reuses the storage-wide `GeneralAccess` schema here, which also lists
    // `ANYONE_WITH_NAME_CAN_READ`. A run has no name to be addressed by, which is exactly why
    // `@apify/consts` declares a separate three-member `RUN_GENERAL_ACCESS`, and that stays the
    // published type.
    generalAccess?: RUN_GENERAL_ACCESS | null;
}

/**
 * Complete Actor run information including statistics and usage details.
 *
 * Represents a single execution of an Actor with all its configuration, status,
 * and resource usage information.
 */
export interface ActorRun
    extends
        Omit<Schemas['Run'], keyof ActorRunRePointed | keyof ActorRunClientNarrowings>,
        ActorRunRePointed,
        ActorRunClientNarrowings {}

type GeneratedTaskStats = Schemas['TaskStats'];
type GeneratedTaskOptions = Schemas['TaskOptions'];
type GeneratedTaskPublicConfig = Schemas['TaskPublicConfig'];
type GeneratedCurrentPricingInfo = Schemas['CurrentPricingInfo'];

/** Statistics about Actor task usage. */
export interface TaskStats extends GeneratedTaskStats {}

/** Configuration options for an Actor task. */
export interface TaskOptions extends GeneratedTaskOptions {}

/**
 * Public-facing display configuration of a task's public landing page.
 *
 * The task is published when `publishedAt` is set and unpublished when it is `null`. The
 * `publishedAt` field is read-only - use {@apilink TaskClient.publish} and
 * {@apilink TaskClient.unpublish} to change the publication state.
 * @since Added in 2.25.0
 */
export interface TaskPublicConfig extends GeneratedTaskPublicConfig {}

/**
 * Fields the API returns on a task that the OpenAPI spec does not describe yet.
 *
 * TODO: Remove once the spec covers it.
 */
export interface TaskSpecGaps {
    description?: string;
}

export interface TaskRePointed {
    stats?: TaskStats | null;
    options?: TaskOptions | null;
    actorStandby?: ActorStandby | null;
    publicConfig?: TaskPublicConfig | null;
    // `Dictionary` is the name this client has always published for a task input object, instead of the
    // spec's `TaskInput`, and the field is reused for `TaskUpdateData`, so it also keeps `update()`
    // accepting what it always has.
    input?: Dictionary | Dictionary[] | null;
}

/**
 * Represents an Actor task.
 *
 * Tasks are saved Actor configurations with input and settings that can be executed
 * repeatedly without having to specify the full input each time.
 */
export interface Task extends Omit<Schemas['Task'], keyof TaskRePointed>, TaskRePointed, TaskSpecGaps {}

export interface TaskListRePointed {
    stats?: TaskStats | null;
}

/**
 * Fields the API returns on a listed task that the OpenAPI spec does not describe yet.
 *
 * `description` is deliberately not here, although `TaskSpecGaps` claims it on the full resource: the
 * list endpoint publishes a smaller set of fields, and that is one of the fields it leaves out.
 *
 * TODO: Remove once the spec covers it.
 */
export interface TaskListSpecGaps {
    title?: string | null;
}

/** A task as it appears in a listing, which carries fewer fields than the full resource. */
export interface TaskList
    extends Omit<Schemas['TaskShort'], keyof TaskListRePointed>, TaskListRePointed, TaskListSpecGaps {}

export interface ActorStoreListRePointed {
    stats: ActorStats;
    currentPricingInfo?: PricingInfo;
}

/**
 * Pricing information as Apify Store reports it.
 *
 * The spec names this schema `CurrentPricingInfo`; the published name is kept as it is. It is a flat
 * summary rather than one of the `ActorRunPricingInfo` variants, so `pricingModel` is a plain string
 * and every price field is optional.
 * @since Added in 2.7.2
 */
export interface PricingInfo extends GeneratedCurrentPricingInfo {}

/**
 * An Actor as it appears in Apify Store.
 * @since Added in 2.7.2
 */
export interface ActorStoreList
    extends Omit<Schemas['StoreListActor'], keyof ActorStoreListRePointed>, ActorStoreListRePointed {}

type GeneratedWebhookStats = Schemas['WebhookStats'];
type GeneratedWebhookCondition = Schemas['WebhookCondition'];

/** Statistics about webhook usage. */
export interface WebhookStats extends GeneratedWebhookStats {}

/** A webhook that fires for any run of a given Actor. */
export interface WebhookAnyRunOfActorCondition {
    actorId: NonNullable<GeneratedWebhookCondition['actorId']>;
}

/** A webhook that fires for any run of a given Actor task. */
export interface WebhookAnyRunOfActorTaskCondition {
    actorTaskId: NonNullable<GeneratedWebhookCondition['actorTaskId']>;
}

/** A webhook that fires for one specific Actor run. */
export interface WebhookCertainRunCondition {
    actorRunId: NonNullable<GeneratedWebhookCondition['actorRunId']>;
}

/**
 * The keys of the spec's flat `WebhookCondition` schema, exactly one of which is set per condition.
 * The published type is a union of one-key variants instead, so each key is reinstated as required by
 * the variant that owns it.
 */
export type WebhookConditionKey = 'actorId' | 'actorTaskId' | 'actorRunId';

/**
 * Condition that determines when a webhook should be triggered.
 *
 * The spec models this as one flat object with all three ids optional and nullable. The published type
 * stays a union of single-id variants: exactly one of them applies to any given webhook, and this same
 * type backs `WebhookUpdateData`, where the flat shape would let a caller send none of them or all
 * three at once.
 */
export type WebhookCondition =
    | WebhookAnyRunOfActorCondition
    | WebhookAnyRunOfActorTaskCondition
    | WebhookCertainRunCondition;

export interface WebhookLastDispatchRePointed {
    status: WebhookDispatchStatus;
}

/**
 * The summary of a webhook's most recent dispatch that the webhook resource carries.
 *
 * The spec names this schema `ExampleWebhookDispatch`.
 */
export interface WebhookLastDispatch
    extends Omit<Schemas['ExampleWebhookDispatch'], keyof WebhookLastDispatchRePointed>, WebhookLastDispatchRePointed {}

/**
 * Fields the API returns on a webhook that the OpenAPI spec does not describe yet.
 *
 * The spec does carry `isApifyIntegration` on `WebhookShort`, the listing shape, and simply omits it
 * from the full `Webhook` schema.
 *
 * TODO: Remove once the spec covers it.
 */
export interface WebhookSpecGaps {
    isApifyIntegration?: boolean;
}

export interface WebhookRePointed {
    condition: WebhookCondition;
    stats?: WebhookStats | null;
    lastDispatch?: WebhookLastDispatch | null;
    eventTypes: WebhookEventType[];
}

/**
 * Represents a webhook configuration.
 *
 * Webhooks send HTTP POST requests to specified URLs when certain events occur
 * (e.g., Actor run succeeds, fails, or times out).
 */
export interface Webhook extends Omit<Schemas['Webhook'], keyof WebhookRePointed>, WebhookRePointed, WebhookSpecGaps {}

type GeneratedScheduleActionRunInput = Schemas['ScheduleActionRunInput'];

/**
 * Types of actions that can be scheduled.
 *
 * Declared here rather than in `./resource_clients/schedule` so that the action types can reference it
 * without closing an import cycle. It is re-exported from there, so the public name and import path are
 * unchanged.
 */
export enum ScheduleActions {
    RunActor = 'RUN_ACTOR',
    RunActorTask = 'RUN_ACTOR_TASK',
}

/** Input configuration for a scheduled Actor run. */
export interface ScheduledActorRunInput extends GeneratedScheduleActionRunInput {}

/**
 * Run options for a scheduled Actor run.
 *
 * The spec reuses its `TaskOptions` schema here; the published name is kept as it is.
 */
export interface ScheduledActorRunOptions extends GeneratedTaskOptions {}

export interface ScheduleActionRunActorRePointed {
    type: ScheduleActions.RunActor;
    runInput?: ScheduledActorRunInput | null;
    runOptions?: ScheduledActorRunOptions | null;
}

/** Scheduled action to run an Actor. */
export interface ScheduleActionRunActor
    extends
        Omit<Schemas['ScheduleActionRunActor'], keyof ScheduleActionRunActorRePointed>,
        ScheduleActionRunActorRePointed {}

export interface ScheduleActionRunActorTaskRePointed {
    type: ScheduleActions.RunActorTask;
}

/** Scheduled action to run an Actor task. */
export interface ScheduleActionRunActorTask
    extends
        Omit<Schemas['ScheduleActionRunActorTask'], keyof ScheduleActionRunActorTaskRePointed>,
        ScheduleActionRunActorTaskRePointed {}

/** Union type representing all possible scheduled actions. */
export type ScheduleAction = ScheduleActionRunActor | ScheduleActionRunActorTask;

type GeneratedScheduleInvoked = Schemas['ScheduleInvoked'];

/** One entry of a schedule's log: an invocation of the schedule and how it went. */
export interface ScheduleInvoked extends GeneratedScheduleInvoked {}

export interface ScheduleRePointed {
    actions: ScheduleAction[];
}

export interface ScheduleClientNarrowings {
    // The spec types the timezone as a bare `string`. The published type is the curated IANA union from
    // `./timezones`, which is also what `ScheduleCreateOrUpdateData` accepts, so widening it would drop
    // the completion and typo-checking that is the whole reason the union exists.
    timezone: Timezone;
}

/**
 * Represents a schedule for automated Actor or Task runs.
 *
 * Schedules use cron expressions to define when Actors or Tasks should run automatically.
 */
export interface Schedule
    extends
        Omit<Schemas['Schedule'], keyof ScheduleRePointed | keyof ScheduleClientNarrowings>,
        ScheduleRePointed,
        ScheduleClientNarrowings {}

type GeneratedProfile = Schemas['Profile'];
type GeneratedProxyGroup = Schemas['ProxyGroup'];
type GeneratedEffectivePlatformFeature = Schemas['EffectivePlatformFeature'];
type GeneratedUsageCycle = Schemas['UsageCycle'];
type GeneratedPriceTiers = Schemas['PriceTiers'];
type GeneratedLimits = Schemas['Limits'];
type GeneratedCurrent = Schemas['Current'];

/**
 * Platform features a plan can enable.
 *
 * This enum is not the element type of `UserPlan.enabledPlatformFeatures`, which the spec types
 * as a plain `string[]`: the platform has features this list never gained -- `PROXY_RESIDENTIAL`,
 * `ACTORS_PUBLIC_ALL` and `ACTORS_PUBLIC_DEVELOPER` all appear as keys of `EffectivePlatformFeatures`
 * -- so using it there promised a completeness that was not real. It stays published for comparisons.
 *
 * Declared here rather than in `./resource_clients/user` so the user types can live alongside it. It is
 * re-exported from there, so the public name and import path are unchanged.
 */
export enum PlatformFeature {
    Actors = 'ACTORS',
    Storage = 'STORAGE',
    ProxySERPS = 'PROXY_SERPS',
    Scheduler = 'SCHEDULER',
    Webhooks = 'WEBHOOKS',
    Proxy = 'PROXY',
    ProxyExternalAccess = 'PROXY_EXTERNAL_ACCESS',
}

/** The public part of a user's profile. */
export interface UserProfile extends GeneratedProfile {}

export interface UserProxyRePointed {
    groups: ProxyGroup[];
}

/** A user's proxy credentials and the groups they may use. */
export interface UserProxy extends Omit<Schemas['Proxy'], keyof UserProxyRePointed>, UserProxyRePointed {}

/** One proxy group available to a user. */
export interface ProxyGroup extends GeneratedProxyGroup {}

/** Whether one platform feature is enabled for a user, and why not if it is off. */
export interface EffectivePlatformFeature extends GeneratedEffectivePlatformFeature {}

export interface EffectivePlatformFeaturesRePointed {
    ACTORS: EffectivePlatformFeature;
    STORAGE: EffectivePlatformFeature;
    SCHEDULER: EffectivePlatformFeature;
    PROXY: EffectivePlatformFeature;
    PROXY_EXTERNAL_ACCESS: EffectivePlatformFeature;
    PROXY_RESIDENTIAL: EffectivePlatformFeature;
    PROXY_SERPS: EffectivePlatformFeature;
    WEBHOOKS: EffectivePlatformFeature;
    ACTORS_PUBLIC_ALL: EffectivePlatformFeature;
    ACTORS_PUBLIC_DEVELOPER: EffectivePlatformFeature;
}

/** The effective state of every platform feature for a user. */
export interface EffectivePlatformFeatures
    extends
        Omit<Schemas['EffectivePlatformFeatures'], keyof EffectivePlatformFeaturesRePointed>,
        EffectivePlatformFeaturesRePointed {}

export interface UserPlanRePointed {
    // Spelled out rather than re-pointed at a published name: the spec's `AvailableProxyGroups` is a bare map,
    // and left alone it would render as an indexed access into the generated file.
    availableProxyGroups: Record<string, number>;
}

/** The subscription plan a user is on, with the quotas it grants. */
export interface UserPlan extends Omit<Schemas['Plan'], keyof UserPlanRePointed>, UserPlanRePointed {}

export interface UserRePointed {
    profile?: UserProfile;
    proxy?: UserProxy;
    plan?: UserPlan;
    effectivePlatformFeatures?: EffectivePlatformFeatures;
}

/**
 * A user account.
 *
 * The private fields are only populated for `GET /v2/users/me`, which needs a token; the public
 * endpoint returns the username and profile alone.
 */
export interface User extends Omit<Schemas['UserPrivateInfo'], keyof UserRePointed>, UserRePointed {}

/**
 * The start and end of a billing cycle.
 * @since Added in 2.9.2
 */
export interface UsageCycle extends GeneratedUsageCycle {}

/**
 * The start and end of a monthly billing cycle. The spec reuses its `UsageCycle` schema here.
 * @since Added in 2.9.2
 */
export interface MonthlyUsageCycle extends GeneratedUsageCycle {}

/** One tier of a volume-discounted price. The spec names this schema `PriceTiers`. */
export interface PriceTier extends GeneratedPriceTiers {}

export interface UsageItemRePointed {
    priceTiers?: PriceTier[];
}

/** What one service cost over a period, before and after volume discounts. */
export interface UsageItem extends Omit<Schemas['UsageItem'], keyof UsageItemRePointed>, UsageItemRePointed {}

/**
 * Usage of each service, keyed by service name such as `ACTOR_COMPUTE_UNITS`.
 *
 * The spec names the monthly map `MonthlyServiceUsage` and the per-day one `ServiceUsage`. The two are
 * structurally identical, so the published type stays single.
 */
export interface ServiceUsage {
    [service: string]: UsageItem;
}

export interface DailyServiceUsageRePointed {
    serviceUsage: ServiceUsage;
}

/** A single day's usage within a monthly cycle. The spec names this schema `DailyServiceUsages`. */
export interface DailyServiceUsage
    extends Omit<Schemas['DailyServiceUsages'], keyof DailyServiceUsageRePointed>, DailyServiceUsageRePointed {}

export interface MonthlyUsageRePointed {
    usageCycle: UsageCycle;
    monthlyServiceUsage: ServiceUsage;
    dailyServiceUsages: DailyServiceUsage[];
}

/**
 * A user's platform usage over the current monthly cycle, broken down by service.
 * @since Added in 2.9.2
 */
export interface MonthlyUsage
    extends Omit<Schemas['MonthlyUsage'], keyof MonthlyUsageRePointed>, MonthlyUsageRePointed {}

/**
 * The quotas a user's plan grants.
 * @since Added in 2.9.2
 */
export interface Limits extends GeneratedLimits {}

/**
 * How much of each quota a user has consumed in the current cycle.
 * @since Added in 2.9.2
 */
export interface Current extends GeneratedCurrent {}

export interface AccountAndUsageLimitsRePointed {
    // The spec types this with its `UsageCycle` schema; the published `MonthlyUsageCycle` name is kept.
    monthlyUsageCycle: MonthlyUsageCycle;
    limits: Limits;
    current: Current;
}

/**
 * A user's quotas together with their current consumption.
 * @since Added in 2.9.2
 */
export interface AccountAndUsageLimits
    extends Omit<Schemas['AccountLimits'], keyof AccountAndUsageLimitsRePointed>, AccountAndUsageLimitsRePointed {}

type GeneratedRequestQueueStats = Schemas['RequestQueueStats'];
type GeneratedHeadRequest = Schemas['HeadRequest'];
type GeneratedLockedHeadRequest = Schemas['LockedHeadRequest'];
type GeneratedRequestRegistration = Schemas['RequestRegistration'];
type GeneratedRequestLockInfo = Schemas['RequestLockInfo'];
type GeneratedUnlockRequestsResult = Schemas['UnlockRequestsResult'];
type GeneratedBatchAddResult = Schemas['BatchAddResult'];
type GeneratedBatchDeleteResult = Schemas['BatchDeleteResult'];
type GeneratedRequest = Schemas['Request'];

/** HTTP methods supported by Request Queue requests. */
export type AllowedHttpMethods = Schemas['HttpMethod'];

/** Statistics about Request Queue usage and storage. */
export interface RequestQueueStats extends GeneratedRequestQueueStats {}

/**
 * Fields the API returns on a request queue that the OpenAPI spec does not describe yet.
 *
 * The spec does carry `username` and `expireAt` on `RequestQueueShort`, the listing shape, and simply
 * omits both from the full `RequestQueue` schema. `title` is absent from either.
 *
 * TODO: Remove once the spec covers them.
 */
export interface RequestQueueSpecGaps {
    title?: string;
    username?: string;
    // A `Date`, not the `string` the wire carries: the key ends in `At`, so `parseDateFields()` converts
    // it, and `RequestQueueShort` types it as a date-time too.
    expireAt?: Date;
}

export interface RequestQueueRePointed {
    stats?: RequestQueueStats;
    generalAccess?: STORAGE_GENERAL_ACCESS | null;
}

export interface RequestQueueSpecNarrowings {
    // Spec lists `consoleUrl` as required on the full resource, and the client types the items of
    // `requestQueues().list()` as this same model. The listing is described by `RequestQueueShort`, which
    // has no `consoleUrl` at all, so a required one would type-check and then be `undefined` per item.
    consoleUrl?: string;
}

/**
 * Represents a Request Queue storage on the Apify platform.
 *
 * Request queues store URLs (requests) to be processed by web crawlers. They provide
 * automatic deduplication, request locking for parallel processing, and persistence.
 */
export interface RequestQueue
    extends
        Omit<Schemas['RequestQueue'], keyof RequestQueueRePointed | keyof RequestQueueSpecNarrowings>,
        RequestQueueRePointed,
        RequestQueueSpecNarrowings,
        RequestQueueSpecGaps {}

/** Simplified request information used in queue-head results. */
export interface RequestQueueClientListItem extends GeneratedHeadRequest {}

/** A queue-head request that has been locked for processing, so it also reports its lock expiry. */
export interface RequestQueueClientLockedListItem extends GeneratedLockedHeadRequest {}

export interface RequestQueueClientListHeadResultRePointed {
    items: RequestQueueClientListItem[];
}

/** Result of listing requests from the queue head. */
export interface RequestQueueClientListHeadResult
    extends
        Omit<Schemas['RequestQueueHead'], keyof RequestQueueClientListHeadResultRePointed>,
        RequestQueueClientListHeadResultRePointed {}

export interface RequestQueueClientListAndLockHeadResultRePointed {
    // The locked element type, which the plain head result does not use.
    items: RequestQueueClientLockedListItem[];
}

/**
 * Result of listing and locking requests from the queue head.
 *
 * The spec describes this and {@link RequestQueueClientListHeadResult} as separate schemas that
 * disagree about which fields are required, and the locked variant carries a different element type,
 * so both are derived independently.
 * @since Added in 2.4.1
 */
export interface RequestQueueClientListAndLockHeadResult
    extends
        Omit<Schemas['LockedRequestQueueHead'], keyof RequestQueueClientListAndLockHeadResultRePointed>,
        RequestQueueClientListAndLockHeadResultRePointed {}

/**
 * Complete schema for a request in the queue.
 *
 * Represents a URL to be crawled along with its metadata, retry information, and custom data.
 */
export interface RequestQueueClientRequestSchema extends GeneratedRequest {}

/**
 * A request as the caller submits it to the queue.
 *
 * The API assigns the id, so it is dropped. The unique key and the URL the caller has to supply come
 * required from {@link RequestQueueClientRequestSchema}.
 */
export interface RequestQueueClientRequestToAdd extends Omit<RequestQueueClientRequestSchema, 'id'> {}

/**
 * A request as the caller submits it to an update of a stored one.
 *
 * The update addresses that request by its id, which a stored request always carries, so the shape is
 * {@link RequestQueueClientRequestSchema} unchanged. The name stays published as the argument type of
 * `updateRequest()`.
 */
export interface RequestQueueClientRequestToUpdate extends RequestQueueClientRequestSchema {}

export interface RequestQueueClientListRequestsResultRePointed {
    items: RequestQueueClientRequestSchema[];
}

/**
 * Result of listing all requests in the queue.
 * @since Added in 2.5.1
 */
export interface RequestQueueClientListRequestsResult
    extends
        Omit<Schemas['ListOfRequests'], keyof RequestQueueClientListRequestsResultRePointed>,
        RequestQueueClientListRequestsResultRePointed {}

/** Result of adding a request to the queue. */
export interface RequestQueueClientAddRequestResult extends GeneratedRequestRegistration {}

/**
 * Result of prolonging a request lock.
 * @since Added in 2.4.1
 */
export interface RequestQueueClientProlongRequestLockResult extends GeneratedRequestLockInfo {}

/**
 * Result of unlocking requests in the queue.
 * @since Added in 2.12.5
 */
export interface RequestQueueClientUnlockRequestsResult extends GeneratedUnlockRequestsResult {}

/**
 * Result of a batch add operation on requests.
 *
 * Contains lists of successfully processed and unprocessed requests.
 * @since Added in 2.3.0
 */
export interface RequestQueueClientBatchRequestsOperationResult extends GeneratedBatchAddResult {}

/**
 * Result of a batch delete operation on requests.
 *
 * A deletion is confirmed by whichever of the two ids addressed it, so a processed entry carries `id`
 * and `uniqueKey` rather than the `requestId`, `wasAlreadyPresent` and `wasAlreadyHandled` that a batch
 * add reports.
 */
export interface RequestQueueClientBatchDeleteRequestsResult extends GeneratedBatchDeleteResult {}
