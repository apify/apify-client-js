/**
 * Compile-time guards that fail `pnpm build:node` when the OpenAPI spec drifts away from an assumption
 * the hand-written models depend on.
 *
 * These live in their own module for two reasons. `noUnusedLocals` rejects a non-exported type alias
 * that nothing references, and exporting them from a module that `src/index.ts` re-exports would grow
 * the public API. Nothing imports this file -- `tsconfig.json` includes all of `src`, so being part of
 * the program is enough for the assertions to be checked.
 *
 * When one of these fails, the fix is a deliberate decision, not a mechanical update: either the shared
 * `@apify/consts` value is stale, or a published type needs a new member, or the spec regressed.
 */

import type {
    ACTOR_JOB_STATUSES,
    ACTOR_PERMISSION_LEVEL,
    ACTOR_SOURCE_TYPES,
    META_ORIGINS,
    RUN_GENERAL_ACCESS,
    STORAGE_GENERAL_ACCESS,
    ValueOf,
    WEBHOOK_DISPATCH_STATUSES,
} from '@apify/consts';

import type { z } from 'zod';

import type { components } from './generated/api.js';
import type * as generatedSchemas from './generated/schemas.js';
import type {
    AccountLimitsRePointed,
    ActorChargeEventRePointed,
    ActorShortRePointed,
    DefaultRunOptionsRePointed,
    ActorDefinitionSpecGaps,
    ActorRePointed,
    RunClientNarrowings,
    RunShortRePointed,
    RunMetaRePointed,
    RunOptionsSpecGaps,
    RunRePointed,
    ActorSourceType,
    ActorSpecGaps,
    StoreListActorRePointed,
    VersionClientNarrowings,
    VersionRePointed,
    VersionSourceLocation,
    BuildShortRePointed,
    BuildsMetaRePointed,
    BuildRePointed,
    DailyServiceUsagesRePointed,
    DatasetRePointed,
    DatasetSpecGaps,
    DatasetSpecNarrowings,
    DatasetStatisticsRePointed,
    DatasetStatsSpecGaps,
    EffectivePlatformFeaturesRePointed,
    ListOfKeysRePointed,
    KeyValueStoreRePointed,
    KeyValueStoreSpecGaps,
    MonthlyUsageRePointed,
    PricePerDatasetItemActorPricingInfoRePointed,
    PayPerEventActorPricingInfoRePointed,
    LockedRequestQueueHeadRePointed,
    RequestQueueHeadRePointed,
    ListOfRequestsRePointed,
    RequestQueueRePointed,
    RequestQueueSpecGaps,
    RequestQueueSpecNarrowings,
    ScheduleActionRunActorRePointed,
    ScheduleActionRunActorTaskRePointed,
    ScheduleActions,
    ScheduleClientNarrowings,
    ScheduleRePointed,
    TaskShortRePointed,
    TaskShortSpecGaps,
    TaskRePointed,
    UsageItemRePointed,
    PlanRePointed,
    ProxyRePointed,
    UserPrivateInfoRePointed,
    Webhook,
    WebhookConditionKey,
    WebhookDispatchRePointed,
    WebhookDispatchWebhookSummaryRePointed,
    WebhookDispatchStatus,
    WebhookDispatchWebhookSummary,
    WebhookEventType,
    ExampleWebhookDispatchRePointed,
    WebhookRePointed,
    WebhookSpecGaps,
} from './models.js';
import type * as responseSchemas from './schemas.js';

type Schemas = components['schemas'];

/** The schema each `lazySchema()` thunk of a module builds, so the guards below can look at the schemas themselves. */
type BuiltSchemas<Thunks> = { [K in keyof Thunks]: Thunks[K] extends () => infer S ? S : never };
type GeneratedSchemas = BuiltSchemas<typeof generatedSchemas>;
type ResponseSchemas = BuiltSchemas<typeof responseSchemas>;

/** Resolves to `true` only for mutually assignable types, so a near-miss still fails. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** Fails to compile unless every member of the tuple is exactly `true`. */
type AssertAll<T extends true[]> = T;

/**
 * Every key an override block replaces must still exist in the schema it overrides.
 *
 * Without this, dropping a field upstream is invisible: `Omit<T, keyof Override>` of a key that no longer
 * exists is a silent no-op, and the override block then supplies the field itself, so the published type
 * keeps advertising something the API has stopped documenting.
 */
type OverridesStillExist<Override, Generated> = Equals<keyof Override & keyof Generated, keyof Override>;

/**
 * Every override must still be at least as wide as the field it replaces.
 *
 * Key-level checks alone are not enough: they pass while the spec changes a field's optionality or
 * nullability underneath an override, which is exactly how a narrowing sneaks in. Adopting a wider spec
 * type is always safe, so the rule is one-directional -- the generated type must remain assignable to the
 * published one. When this fails, either drop the override and take the spec's type, or record why the
 * API really is narrower than the spec now claims.
 *
 * `Pick` deliberately keeps each key's optionality: a field the spec demotes to optional stops being
 * assignable to an override that still declares it required, so this is also where required-to-optional
 * drift is caught. `OverridesStillExist` cannot see it -- `keyof` does not distinguish `x` from `x?`.
 */
type OverridesStayWider<Override, Generated> =
    Pick<Generated, keyof Override & keyof Generated> extends Pick<Override, keyof Override & keyof Generated>
        ? true
        : false;

/** Every `*SpecGaps` key must still be absent upstream, so a filled gap shows up as a build failure. */
type GapsStillMissing<Gaps, Generated> = Equals<keyof Gaps & keyof Generated, never>;

/**
 * `@apify/consts` stays the source of truth for the enums it declares, rather than the spec, because
 * `apify-sdk-js` and `crawlee` consume those same types -- diverging would break structural
 * compatibility across the Apify JS ecosystem. These assertions prove the two still agree.
 */
export type EnumGuards = AssertAll<
    [
        Equals<Schemas['GeneralAccess'], STORAGE_GENERAL_ACCESS>,
        Equals<Schemas['WebhookEventType'], WebhookEventType>,
        // `WebhookDispatchStatus` is a runtime enum this package publishes itself, so it is pinned to
        // `@apify/consts` first -- asserting it only against the spec would quietly make the spec its source
        // of truth and contradict the policy above. The spec is checked too, so all three stay in step.
        Equals<`${WebhookDispatchStatus}`, ValueOf<typeof WEBHOOK_DISPATCH_STATUSES>>,
        Equals<Schemas['WebhookDispatchStatus'], `${WebhookDispatchStatus}`>,
        // `ActorSourceType` is the other runtime enum this package publishes, so it gets the same
        // two-sided treatment: pinned to `@apify/consts` first, and checked against the spec too.
        Equals<`${ActorSourceType}`, ValueOf<typeof ACTOR_SOURCE_TYPES>>,
        Equals<Schemas['VersionSourceType'], `${ActorSourceType}`>,
        // `ScheduleActions` is the third published runtime enum. `@apify/consts` does not declare an
        // equivalent, so the spec's per-variant `type` constants are the only thing to pin it against.
        Equals<Schemas['ScheduleActionRunActor']['type'], `${ScheduleActions.RunActor}`>,
        Equals<Schemas['ScheduleActionRunActorTask']['type'], `${ScheduleActions.RunActorTask}`>,
        Equals<Schemas['ActorPermissionLevel'], ACTOR_PERMISSION_LEVEL>,
        Equals<Schemas['ActorJobStatus'], ValueOf<typeof ACTOR_JOB_STATUSES>>,
        // `@apify/consts` leads the spec on run origins -- a new one is declared there as soon as the API can
        // report it, while apify-docs publishes it a release later (`APIFY_AI` is in that state today). The
        // published field is typed from `@apify/consts`, so the spec being narrower is harmless; what must hold
        // is that the spec never carries an origin the published union would reject.
        Equals<Schemas['RunOrigin'] & ValueOf<typeof META_ORIGINS>, Schemas['RunOrigin']>,
        // A run reuses the storage-wide `GeneralAccess` schema in the spec, so equality is the wrong
        // question -- `RUN_GENERAL_ACCESS` omits `ANYONE_WITH_NAME_CAN_READ` because a run has no name.
        // What must hold is that every run-level value is still one the spec knows about.
        Equals<RUN_GENERAL_ACCESS & Schemas['GeneralAccess'], RUN_GENERAL_ACCESS>,
    ]
>;

/**
 * `WebhookDispatch.webhook` is a summary of the webhook that triggered it, and the two schemas have to
 * keep agreeing about the fields they share. It is declared from the spec's summary rather than as
 * `Pick<Webhook, ...>`, because the summary also carries `actionType` and `condition`, so the overlap
 * is asserted here instead.
 *
 * Only `requestUrl` is asserted. It is nullable on both sides, because a hook action other than a
 * plain HTTP request -- Slack, email -- has no URL to report. `isAdHoc` is left out: the spec types it
 * as nullable on the full `Webhook` and non-nullable on the summary, and there is no reason to think
 * the API really answers differently for the two, so pinning them to each other would only encode the
 * inconsistency.
 */
export type WebhookDispatchGuards = AssertAll<
    [Equals<Pick<WebhookDispatchWebhookSummary, 'requestUrl'>, Pick<Webhook, 'requestUrl'>>]
>;

/**
 * Keeps the adapter honest about which fields it overrides and which the spec is still missing. A
 * failure here means the spec moved: either a field the client overrides was dropped or renamed, or a
 * gap was filled and its `*SpecGaps` entry should now be deleted.
 */
export type AdapterKeyGuards = AssertAll<
    [
        OverridesStillExist<DatasetRePointed, Schemas['Dataset']>,
        OverridesStillExist<DatasetSpecNarrowings, Schemas['Dataset']>,
        OverridesStillExist<DatasetStatisticsRePointed, Schemas['DatasetStatistics']>,
        OverridesStillExist<WebhookDispatchRePointed, Schemas['WebhookDispatch']>,
        OverridesStillExist<WebhookDispatchWebhookSummaryRePointed, Schemas['WebhookDispatchWebhookSummary']>,
        OverridesStillExist<KeyValueStoreRePointed, Schemas['KeyValueStore']>,
        OverridesStillExist<ListOfKeysRePointed, Schemas['ListOfKeys']>,
        OverridesStillExist<VersionRePointed, Schemas['Version']>,
        OverridesStillExist<VersionClientNarrowings, Schemas['Version']>,
        // `BaseVersion` drops these four by name so each union variant can reinstate the one its
        // source type implies. Unlike the override blocks, a bare key union in `Omit` is not checked by
        // the compiler at all, so losing one upstream would silently leave the variants inventing it.
        Equals<VersionSourceLocation & keyof Schemas['Version'], VersionSourceLocation>,
        // `VersionSourceFiles` spells the element union out by its published names rather than
        // deriving it, so a member gained or lost upstream has to fail here.
        Equals<
            NonNullable<Schemas['Version']['sourceFiles']>[number],
            Schemas['SourceCodeFile'] | Schemas['SourceCodeFolder']
        >,
        OverridesStillExist<ActorRePointed, Schemas['Actor']>,
        OverridesStillExist<ActorShortRePointed, Schemas['ActorShort']>,
        OverridesStillExist<DefaultRunOptionsRePointed, Schemas['DefaultRunOptions']>,
        OverridesStillExist<ActorChargeEventRePointed, Schemas['ActorChargeEvent']>,
        OverridesStillExist<
            PricePerDatasetItemActorPricingInfoRePointed,
            Schemas['PricePerDatasetItemActorPricingInfo']
        >,
        OverridesStillExist<PayPerEventActorPricingInfoRePointed, Schemas['PayPerEventActorPricingInfo']>,
        // The spec inlines `pricingPerEvent` rather than naming it, so the override spells the whole
        // object out. A key gained upstream would otherwise be dropped instead of published.
        Equals<
            keyof Schemas['PayPerEventActorPricingInfo']['pricingPerEvent'],
            keyof PayPerEventActorPricingInfoRePointed['pricingPerEvent']
        >,
        OverridesStillExist<BuildRePointed, Schemas['Build']>,
        OverridesStillExist<BuildsMetaRePointed, Schemas['BuildsMeta']>,
        OverridesStillExist<BuildShortRePointed, Schemas['BuildShort']>,
        OverridesStillExist<RunRePointed, Schemas['Run']>,
        OverridesStillExist<RunClientNarrowings, Schemas['Run']>,
        OverridesStillExist<RunShortRePointed, Schemas['RunShort']>,
        OverridesStillExist<RunMetaRePointed, Schemas['RunMeta']>,
        OverridesStillExist<TaskRePointed, Schemas['Task']>,
        OverridesStillExist<TaskShortRePointed, Schemas['TaskShort']>,
        OverridesStillExist<StoreListActorRePointed, Schemas['StoreListActor']>,
        OverridesStillExist<WebhookRePointed, Schemas['Webhook']>,
        OverridesStillExist<ExampleWebhookDispatchRePointed, Schemas['ExampleWebhookDispatch']>,
        OverridesStillExist<ScheduleRePointed, Schemas['Schedule']>,
        OverridesStillExist<ScheduleClientNarrowings, Schemas['Schedule']>,
        OverridesStillExist<ScheduleActionRunActorRePointed, Schemas['ScheduleActionRunActor']>,
        OverridesStillExist<ScheduleActionRunActorTaskRePointed, Schemas['ScheduleActionRunActorTask']>,
        OverridesStillExist<UserPrivateInfoRePointed, Schemas['UserPrivateInfo']>,
        OverridesStillExist<ProxyRePointed, Schemas['Proxy']>,
        OverridesStillExist<EffectivePlatformFeaturesRePointed, Schemas['EffectivePlatformFeatures']>,
        // `EffectivePlatformFeaturesRePointed` re-points every key of the schema, so equality rather
        // than containment: a feature gained upstream would otherwise survive the `Omit` and be typed
        // from the generated schema instead of the published `EffectivePlatformFeature`.
        Equals<keyof Schemas['EffectivePlatformFeatures'], keyof EffectivePlatformFeaturesRePointed>,
        OverridesStillExist<PlanRePointed, Schemas['Plan']>,
        OverridesStillExist<MonthlyUsageRePointed, Schemas['MonthlyUsage']>,
        OverridesStillExist<UsageItemRePointed, Schemas['UsageItem']>,
        OverridesStillExist<DailyServiceUsagesRePointed, Schemas['DailyServiceUsages']>,
        OverridesStillExist<AccountLimitsRePointed, Schemas['AccountLimits']>,
        OverridesStillExist<RequestQueueRePointed, Schemas['RequestQueue']>,
        OverridesStillExist<RequestQueueSpecNarrowings, Schemas['RequestQueue']>,
        OverridesStillExist<RequestQueueHeadRePointed, Schemas['RequestQueueHead']>,
        OverridesStillExist<LockedRequestQueueHeadRePointed, Schemas['LockedRequestQueueHead']>,
        OverridesStillExist<ListOfRequestsRePointed, Schemas['ListOfRequests']>,
        // The spec requires all three on a stored request, and `scripts/spec_transform.mts` hoists that
        // `required` out of the `$ref` sibling position `openapi-typescript` drops. Should either end stop
        // holding, `RequestQueueClientRequestToAdd` would quietly stop demanding a URL.
        Equals<
            Pick<Schemas['Request'], 'id' | 'uniqueKey' | 'url'>,
            Required<Pick<Schemas['Request'], 'id' | 'uniqueKey' | 'url'>>
        >,
        // The published `WebhookCondition` union reinstates each of these as the required key of its own
        // variant, so losing one upstream must not pass unnoticed.
        Equals<WebhookConditionKey & keyof Schemas['WebhookCondition'], WebhookConditionKey>,
        GapsStillMissing<DatasetSpecGaps, Schemas['Dataset']>,
        GapsStillMissing<DatasetStatsSpecGaps, Schemas['DatasetStats']>,
        GapsStillMissing<KeyValueStoreSpecGaps, Schemas['KeyValueStore']>,
        GapsStillMissing<ActorSpecGaps, Schemas['Actor']>,
        GapsStillMissing<ActorDefinitionSpecGaps, Schemas['ActorDefinition']>,
        GapsStillMissing<RunOptionsSpecGaps, Schemas['RunOptions']>,
        // `TaskShort` has a gap of its own, because the spec describes a listed task in a separate schema
        // that omits `title` as well.
        GapsStillMissing<TaskShortSpecGaps, Schemas['TaskShort']>,
        GapsStillMissing<WebhookSpecGaps, Schemas['Webhook']>,
        GapsStillMissing<RequestQueueSpecGaps, Schemas['RequestQueue']>,
    ]
>;

/**
 * The same overrides, checked for width rather than just for existence. Split from `AdapterKeyGuards` so a
 * failure says which of the two rules broke.
 *
 * Every exclusion is noted next to the entry it relates to. One is here rather than inline, because width
 * is not the right question for it: `WebhookDispatch.status` and `ExampleWebhookDispatch.status` publish this
 * package's runtime enum, and a string-literal union is never assignable to a string enum even when the
 * members are identical. Their members are pinned by `EnumGuards` instead, against both `@apify/consts`
 * and the spec. The four `status` overrides typed from `ACTOR_JOB_STATUSES` are plain unions, so they are
 * checked here.
 */
export type AdapterWidthGuards = AssertAll<
    [
        OverridesStayWider<DatasetRePointed, Schemas['Dataset']>,
        OverridesStayWider<DatasetSpecNarrowings, Schemas['Dataset']>,
        OverridesStayWider<DatasetStatisticsRePointed, Schemas['DatasetStatistics']>,
        // `webhook` is excluded alongside `status`: the summary it re-points at narrows `condition` to
        // the published union, so the generated dispatch is no longer assignable to it.
        OverridesStayWider<Omit<WebhookDispatchRePointed, 'status' | 'webhook'>, Schemas['WebhookDispatch']>,
        // `WebhookDispatchWebhookSummaryRePointed` is excluded outright: its only key is the same
        // `condition` narrowing the webhook itself carries, argued at the declaration of the union.
        OverridesStayWider<KeyValueStoreRePointed, Schemas['KeyValueStore']>,
        OverridesStayWider<ListOfKeysRePointed, Schemas['ListOfKeys']>,
        // `VersionClientNarrowings` has no entry here on purpose: dropping the spec's
        // `sourceType: null` is the one narrowing the version union rests on, and it is argued for at
        // the declaration.
        OverridesStayWider<VersionRePointed, Schemas['Version']>,
        // `versions` is excluded: it re-points at the discriminated `Version` union, which is
        // narrower than the spec's flat `Version` by design.
        OverridesStayWider<Omit<ActorRePointed, 'versions'>, Schemas['Actor']>,
        OverridesStayWider<ActorShortRePointed, Schemas['ActorShort']>,
        OverridesStayWider<DefaultRunOptionsRePointed, Schemas['DefaultRunOptions']>,
        OverridesStayWider<ActorChargeEventRePointed, Schemas['ActorChargeEvent']>,
        OverridesStayWider<
            PricePerDatasetItemActorPricingInfoRePointed,
            Schemas['PricePerDatasetItemActorPricingInfo']
        >,
        OverridesStayWider<PayPerEventActorPricingInfoRePointed, Schemas['PayPerEventActorPricingInfo']>,
        OverridesStayWider<BuildRePointed, Schemas['Build']>,
        OverridesStayWider<BuildsMetaRePointed, Schemas['BuildsMeta']>,
        OverridesStayWider<BuildShortRePointed, Schemas['BuildShort']>,
        // `RunClientNarrowings` has no entry here: narrowing the spec's storage-wide `GeneralAccess`
        // to the three-member run-specific union is the point of that block, and it is argued for at the
        // declaration. `EnumGuards` checks instead that the three are still a subset of the spec's four.
        OverridesStayWider<RunRePointed, Schemas['Run']>,
        OverridesStayWider<RunShortRePointed, Schemas['RunShort']>,
        OverridesStayWider<RunMetaRePointed, Schemas['RunMeta']>,
        OverridesStayWider<TaskRePointed, Schemas['Task']>,
        OverridesStayWider<TaskShortRePointed, Schemas['TaskShort']>,
        OverridesStayWider<StoreListActorRePointed, Schemas['StoreListActor']>,
        // Two exclusions. `condition` keeps the union of single-id variants, which is narrower than the
        // spec's flat schema by design and argued for at the declaration. `lastDispatch` re-points at a
        // type whose `status` is the published runtime enum, and a string-literal union is never
        // assignable to a string enum even when the members match -- `EnumGuards` pins those instead.
        OverridesStayWider<Omit<WebhookRePointed, 'condition' | 'lastDispatch'>, Schemas['Webhook']>,
        OverridesStayWider<ScheduleRePointed, Schemas['Schedule']>,
        OverridesStayWider<ScheduleActionRunActorRePointed, Schemas['ScheduleActionRunActor']>,
        OverridesStayWider<ScheduleActionRunActorTaskRePointed, Schemas['ScheduleActionRunActorTask']>,
        // `timezone` is excluded: it narrows the spec's bare `string` to the curated IANA union on
        // purpose, argued for at the declaration.
        OverridesStayWider<UserPrivateInfoRePointed, Schemas['UserPrivateInfo']>,
        OverridesStayWider<ProxyRePointed, Schemas['Proxy']>,
        OverridesStayWider<EffectivePlatformFeaturesRePointed, Schemas['EffectivePlatformFeatures']>,
        OverridesStayWider<PlanRePointed, Schemas['Plan']>,
        OverridesStayWider<MonthlyUsageRePointed, Schemas['MonthlyUsage']>,
        OverridesStayWider<UsageItemRePointed, Schemas['UsageItem']>,
        OverridesStayWider<DailyServiceUsagesRePointed, Schemas['DailyServiceUsages']>,
        OverridesStayWider<AccountLimitsRePointed, Schemas['AccountLimits']>,
        OverridesStayWider<RequestQueueRePointed, Schemas['RequestQueue']>,
        OverridesStayWider<RequestQueueSpecNarrowings, Schemas['RequestQueue']>,
        OverridesStayWider<RequestQueueHeadRePointed, Schemas['RequestQueueHead']>,
        OverridesStayWider<LockedRequestQueueHeadRePointed, Schemas['LockedRequestQueueHead']>,
        OverridesStayWider<ListOfRequestsRePointed, Schemas['ListOfRequests']>,
    ]
>;

/**
 * Published maps that are written out by hand rather than derived from the spec.
 *
 * Each is an index signature whose value type had to be re-pointed at the published entry, which
 * `interface ... extends` cannot express, so the shape is spelled out instead. These assertions are what
 * keeps it tied to the spec: they fail once a map stops being a plain string-keyed map of its entry
 * schema. The two service-usage schemas are also pinned to each other, because one published
 * `ServiceUsage` stands for both.
 */
export type MapShapeGuards = AssertAll<
    [
        Equals<Schemas['TieredPricingPerDatasetItem'], Record<string, Schemas['TieredPricingPerDatasetItemEntry']>>,
        Equals<Schemas['TieredPricingPerEvent'], Record<string, Schemas['TieredPricingPerEventEntry']>>,
        Equals<Schemas['ServiceUsage'], Record<string, Schemas['UsageItem']>>,
        Equals<Schemas['MonthlyServiceUsage'], Record<string, Schemas['UsageItem']>>,
        Equals<Schemas['TaggedBuilds'], Record<string, Schemas['TaggedBuildInfo'] | null>>,
        Equals<Schemas['AvailableProxyGroups'], Record<string, number>>,
        // The spec inlines this map into `PayPerEventActorPricingInfo` rather than naming it.
        Equals<
            NonNullable<Schemas['PayPerEventActorPricingInfo']['pricingPerEvent']['actorChargeEvents']>,
            Record<string, Schemas['ActorChargeEvent']>
        >,
    ]
>;

/**
 * The names of every schema whose generated type is not produced by its generated zod schema.
 *
 * Both are generated from the same specification, by different generators, so this is where a bug in
 * `scripts/schema_emitter.mts` -- a dropped property, a wrong optionality, a missed `null` -- shows up as
 * a build failure instead of as a response rejected in production. The check is one-directional on
 * purpose: the zod schemas accept unknown fields and unknown enum values that the types do not describe,
 * so their output is deliberately wider than the types. It is the output that is compared, because a
 * `date-time` field takes the wire's string and hands back the `Date` the type declares.
 */
type SchemasRejectingTheirType = {
    [K in keyof Schemas]: K extends keyof GeneratedSchemas
        ? Schemas[K] extends z.output<GeneratedSchemas[K]>
            ? never
            : K
        : K;
}[keyof Schemas];

export type GeneratedSchemaGuards = AssertAll<
    [
        Equals<SchemasRejectingTheirType, never>,
        // Both generators saw the same `components.schemas`, so neither may have a schema the other lacks.
        Equals<Exclude<keyof GeneratedSchemas, keyof Schemas>, never>,
    ]
>;

/**
 * Every hand-written override in `./schemas` still produces what the specification describes: an override
 * may only widen.
 */
type OverridesRejectingTheirType = {
    [K in keyof ResponseSchemas & keyof Schemas]: Schemas[K] extends z.output<ResponseSchemas[K]> ? never : K;
}[keyof ResponseSchemas & keyof Schemas];

/**
 * Every key an override extends a generated object with must still exist in the specification's schema.
 * `.extend()` with a key the specification has since dropped or renamed would quietly add it back.
 */
type OverridesWithUnknownKeys = {
    [K in keyof ResponseSchemas & keyof Schemas]: ResponseSchemas[K] extends { shape: infer Shape }
        ? Exclude<keyof Shape, keyof Schemas[K]> extends never
            ? never
            : K
        : never;
}[keyof ResponseSchemas & keyof Schemas];

export type ResponseSchemaGuards = AssertAll<
    [Equals<OverridesRejectingTheirType, never>, Equals<OverridesWithUnknownKeys, never>]
>;
