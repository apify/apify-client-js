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

import type { components } from './generated/api';
import type {
    AccountAndUsageLimitsRePointed,
    ActorChargeEventRePointed,
    ActorDefaultRunOptionsRePointed,
    ActorDefinitionSpecGaps,
    ActorDefinitionSpecNarrowings,
    ActorRePointed,
    ActorRunListItemRePointed,
    ActorRunMetaRePointed,
    ActorRunOptionsSpecGaps,
    ActorRunRePointed,
    ActorRunSpecNarrowings,
    ActorSourceType,
    ActorSpecGaps,
    ActorStoreListRePointed,
    ActorVersionRePointed,
    ActorVersionSourceLocation,
    ActorVersionSpecNarrowings,
    BuildCollectionClientListItemRePointed,
    BuildMetaRePointed,
    BuildRePointed,
    DatasetSpecGaps,
    DatasetSpecNarrowings,
    DatasetStatisticsRePointed,
    DatasetStatsSpecGaps,
    KeyValueClientListKeysResultRePointed,
    KeyValueStoreSpecGaps,
    KeyValueStoreSpecNarrowings,
    MonthlyUsageRePointed,
    PricePerDatasetItemActorPricingInfoRePointed,
    PricePerEventActorPricingInfoRePointed,
    RequestQueueClientListAndLockHeadResultRePointed,
    RequestQueueClientListHeadResultRePointed,
    RequestQueueClientListRequestsResultRePointed,
    RequestQueueSpecGaps,
    RequestQueueSpecNarrowings,
    ScheduleActionRunActorRePointed,
    ScheduleActionRunActorTaskRePointed,
    ScheduleActions,
    ScheduleRePointed,
    ScheduleSpecNarrowings,
    TaskListRePointed,
    TaskRePointed,
    TaskSpecGaps,
    TaskSpecNarrowings,
    UserPlanRePointed,
    UserRePointed,
    UserSpecNarrowings,
    Webhook,
    WebhookConditionKey,
    WebhookDispatch,
    WebhookDispatchRePointed,
    WebhookDispatchStatus,
    WebhookDispatchWebhookSummary,
    WebhookEventType,
    WebhookLastDispatchRePointed,
    WebhookRePointed,
    WebhookSpecGaps,
} from './models';

type Schemas = components['schemas'];

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
 * Optional keys are compared through a required lens, because whether a key may be absent is checked by
 * `OverridesStillExist` and reading `Pick` of an optional key would otherwise add `undefined` to both
 * sides and hide a real difference.
 */
type OverridesStayWider<Override, Generated> =
    Required<Pick<Generated, keyof Override & keyof Generated>> extends Required<
        Pick<Override, keyof Override & keyof Generated>
    >
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
 * keep agreeing about the fields they share. It is no longer declared as `Pick<Webhook, ...>`, because
 * the spec's summary also carries `actionType` and `condition`, but the overlap is asserted here.
 *
 * Only `requestUrl` is asserted. It is nullable on both sides, because a hook action other than a
 * plain HTTP request -- Slack, email -- has no URL to report. `isAdHoc` is left out: the spec types it
 * as nullable on the full `Webhook` and non-nullable on the summary, and there is no reason to think
 * the API really answers differently for the two, so pinning them to each other would only encode the
 * inconsistency.
 */
export type WebhookDispatchGuards = AssertAll<
    [
        Equals<WebhookDispatch['eventType'], WebhookEventType>,
        Equals<Pick<WebhookDispatchWebhookSummary, 'requestUrl'>, Pick<Webhook, 'requestUrl'>>,
    ]
>;

/**
 * Keeps the adapter honest about which fields it overrides and which the spec is still missing. A
 * failure here means the spec moved: either a field the client overrides was dropped or renamed, or a
 * gap was filled and its `*SpecGaps` entry should now be deleted.
 */
export type AdapterKeyGuards = AssertAll<
    [
        OverridesStillExist<DatasetSpecNarrowings, Schemas['Dataset']>,
        OverridesStillExist<DatasetStatisticsRePointed, Schemas['DatasetStatistics']>,
        OverridesStillExist<WebhookDispatchRePointed, Schemas['WebhookDispatch']>,
        OverridesStillExist<KeyValueStoreSpecNarrowings, Schemas['KeyValueStore']>,
        OverridesStillExist<KeyValueClientListKeysResultRePointed, Schemas['ListOfKeys']>,
        OverridesStillExist<ActorVersionRePointed, Schemas['Version']>,
        OverridesStillExist<ActorVersionSpecNarrowings, Schemas['Version']>,
        // `BaseActorVersion` drops these four by name so each union variant can reinstate the one its
        // source type implies. Unlike the override blocks, a bare key union in `Omit` is not checked by
        // the compiler at all, so losing one upstream would silently leave the variants inventing it.
        Equals<ActorVersionSourceLocation & keyof Schemas['Version'], ActorVersionSourceLocation>,
        OverridesStillExist<ActorRePointed, Schemas['Actor']>,
        OverridesStillExist<ActorDefaultRunOptionsRePointed, Schemas['DefaultRunOptions']>,
        OverridesStillExist<ActorDefinitionSpecNarrowings, Schemas['ActorDefinition']>,
        OverridesStillExist<ActorChargeEventRePointed, Schemas['ActorChargeEvent']>,
        OverridesStillExist<
            PricePerDatasetItemActorPricingInfoRePointed,
            Schemas['PricePerDatasetItemActorPricingInfo']
        >,
        OverridesStillExist<PricePerEventActorPricingInfoRePointed, Schemas['PayPerEventActorPricingInfo']>,
        OverridesStillExist<BuildRePointed, Schemas['Build']>,
        OverridesStillExist<BuildMetaRePointed, Schemas['BuildsMeta']>,
        OverridesStillExist<BuildCollectionClientListItemRePointed, Schemas['BuildShort']>,
        OverridesStillExist<ActorRunRePointed, Schemas['Run']>,
        OverridesStillExist<ActorRunSpecNarrowings, Schemas['Run']>,
        OverridesStillExist<ActorRunListItemRePointed, Schemas['RunShort']>,
        OverridesStillExist<ActorRunMetaRePointed, Schemas['RunMeta']>,
        OverridesStillExist<TaskRePointed, Schemas['Task']>,
        OverridesStillExist<TaskSpecNarrowings, Schemas['Task']>,
        OverridesStillExist<TaskListRePointed, Schemas['TaskShort']>,
        OverridesStillExist<ActorStoreListRePointed, Schemas['StoreListActor']>,
        OverridesStillExist<WebhookRePointed, Schemas['Webhook']>,
        OverridesStillExist<WebhookLastDispatchRePointed, Schemas['ExampleWebhookDispatch']>,
        OverridesStillExist<ScheduleRePointed, Schemas['Schedule']>,
        OverridesStillExist<ScheduleSpecNarrowings, Schemas['Schedule']>,
        OverridesStillExist<ScheduleActionRunActorRePointed, Schemas['ScheduleActionRunActor']>,
        OverridesStillExist<ScheduleActionRunActorTaskRePointed, Schemas['ScheduleActionRunActorTask']>,
        OverridesStillExist<UserRePointed, Schemas['UserPrivateInfo']>,
        OverridesStillExist<UserSpecNarrowings, Schemas['UserPrivateInfo']>,
        OverridesStillExist<UserPlanRePointed, Schemas['Plan']>,
        OverridesStillExist<MonthlyUsageRePointed, Schemas['MonthlyUsage']>,
        OverridesStillExist<AccountAndUsageLimitsRePointed, Schemas['AccountLimits']>,
        OverridesStillExist<RequestQueueSpecNarrowings, Schemas['RequestQueue']>,
        OverridesStillExist<RequestQueueClientListHeadResultRePointed, Schemas['RequestQueueHead']>,
        OverridesStillExist<RequestQueueClientListAndLockHeadResultRePointed, Schemas['LockedRequestQueueHead']>,
        OverridesStillExist<RequestQueueClientListRequestsResultRePointed, Schemas['ListOfRequests']>,
        // The published `WebhookCondition` union reinstates each of these as the required key of its own
        // variant, so losing one upstream must not pass unnoticed.
        Equals<WebhookConditionKey & keyof Schemas['WebhookCondition'], WebhookConditionKey>,
        GapsStillMissing<DatasetSpecGaps, Schemas['Dataset']>,
        GapsStillMissing<DatasetStatsSpecGaps, Schemas['DatasetStats']>,
        GapsStillMissing<KeyValueStoreSpecGaps, Schemas['KeyValueStore']>,
        GapsStillMissing<ActorSpecGaps, Schemas['Actor']>,
        GapsStillMissing<ActorDefinitionSpecGaps, Schemas['ActorDefinition']>,
        GapsStillMissing<ActorRunOptionsSpecGaps, Schemas['RunOptions']>,
        GapsStillMissing<TaskSpecGaps, Schemas['Task']>,
        // `TaskList` carries the same gap, and the spec describes it in a schema of its own.
        GapsStillMissing<TaskSpecGaps, Schemas['TaskShort']>,
        GapsStillMissing<WebhookSpecGaps, Schemas['Webhook']>,
        GapsStillMissing<RequestQueueSpecGaps, Schemas['RequestQueue']>,
    ]
>;

/**
 * The same overrides, checked for width rather than just for existence. Split from `AdapterKeyGuards` so a
 * failure says which of the two rules broke.
 *
 * Two groups are deliberately excluded, because width is not the right question for either:
 *
 *   - `calls`, `webhook` and `eventData` re-point at adapted types that are intentionally not the
 *     generated ones.
 *   - `status` publishes a runtime enum, and a string-literal union is never assignable to a string enum
 *     even when the members are identical. Its members are pinned by `EnumGuards` instead, against both
 *     `@apify/consts` and the spec.
 */
export type AdapterWidthGuards = AssertAll<
    [
        OverridesStayWider<DatasetSpecNarrowings, Schemas['Dataset']>,
        OverridesStayWider<DatasetStatisticsRePointed, Schemas['DatasetStatistics']>,
        OverridesStayWider<Pick<WebhookDispatchRePointed, 'eventType'>, Schemas['WebhookDispatch']>,
        OverridesStayWider<KeyValueStoreSpecNarrowings, Schemas['KeyValueStore']>,
        OverridesStayWider<KeyValueClientListKeysResultRePointed, Schemas['ListOfKeys']>,
        // `sourceType` is excluded on purpose: dropping the spec's `null` is the one narrowing the
        // version union rests on, and it is argued for at the declaration.
        OverridesStayWider<ActorVersionRePointed, Schemas['Version']>,
        // `versions` is excluded for the same reason: it re-points at the discriminated
        // `ActorVersion` union, which is narrower than the spec's flat `Version` by design.
        OverridesStayWider<Omit<ActorRePointed, 'versions'>, Schemas['Actor']>,
        OverridesStayWider<ActorDefaultRunOptionsRePointed, Schemas['DefaultRunOptions']>,
        OverridesStayWider<ActorDefinitionSpecNarrowings, Schemas['ActorDefinition']>,
        OverridesStayWider<ActorChargeEventRePointed, Schemas['ActorChargeEvent']>,
        OverridesStayWider<
            PricePerDatasetItemActorPricingInfoRePointed,
            Schemas['PricePerDatasetItemActorPricingInfo']
        >,
        OverridesStayWider<PricePerEventActorPricingInfoRePointed, Schemas['PayPerEventActorPricingInfo']>,
        OverridesStayWider<BuildRePointed, Schemas['Build']>,
        OverridesStayWider<BuildMetaRePointed, Schemas['BuildsMeta']>,
        OverridesStayWider<BuildCollectionClientListItemRePointed, Schemas['BuildShort']>,
        OverridesStayWider<ActorRunRePointed, Schemas['Run']>,
        OverridesStayWider<ActorRunListItemRePointed, Schemas['RunShort']>,
        OverridesStayWider<ActorRunMetaRePointed, Schemas['RunMeta']>,
        OverridesStayWider<TaskRePointed, Schemas['Task']>,
        OverridesStayWider<TaskListRePointed, Schemas['TaskShort']>,
        OverridesStayWider<ActorStoreListRePointed, Schemas['StoreListActor']>,
        // Two exclusions. `condition` keeps the union of single-id variants, which is narrower than the
        // spec's flat schema by design and argued for at the declaration. `lastDispatch` re-points at a
        // type whose `status` is the published runtime enum, and a string-literal union is never
        // assignable to a string enum even when the members match -- `EnumGuards` pins those instead.
        OverridesStayWider<Omit<WebhookRePointed, 'condition' | 'lastDispatch'>, Schemas['Webhook']>,
        // `type` is excluded on both action variants, and `timezone` on the schedule: the first two
        // publish a runtime enum, and the third narrows the spec's bare `string` to the curated IANA
        // union on purpose. `EnumGuards` pins the two `type` constants instead. `Schedule.actions` is
        // excluded for the same reason as the two `type` constants it carries: the re-pointed element
        // union discriminates on a runtime enum, so no assignability check can hold either way.
        OverridesStayWider<Omit<ScheduleActionRunActorRePointed, 'type'>, Schemas['ScheduleActionRunActor']>,
        OverridesStayWider<UserRePointed, Schemas['UserPrivateInfo']>,
        OverridesStayWider<UserSpecNarrowings, Schemas['UserPrivateInfo']>,
        OverridesStayWider<UserPlanRePointed, Schemas['Plan']>,
        OverridesStayWider<MonthlyUsageRePointed, Schemas['MonthlyUsage']>,
        OverridesStayWider<AccountAndUsageLimitsRePointed, Schemas['AccountLimits']>,
        OverridesStayWider<RequestQueueSpecNarrowings, Schemas['RequestQueue']>,
        OverridesStayWider<RequestQueueClientListHeadResultRePointed, Schemas['RequestQueueHead']>,
        OverridesStayWider<RequestQueueClientListAndLockHeadResultRePointed, Schemas['LockedRequestQueueHead']>,
        OverridesStayWider<RequestQueueClientListRequestsResultRePointed, Schemas['ListOfRequests']>,
        // `Task.input` is excluded: keeping the array form the spec dropped is the point of that
        // override, and it is argued for at the declaration.
        // `ActorRun.generalAccess` is excluded: narrowing the spec's storage-wide `GeneralAccess` to the
        // three-member run-specific union is the point of that override, and it is argued for at the
        // declaration. `EnumGuards` checks instead that the three are still a subset of the spec's four.
    ]
>;
