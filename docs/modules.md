# apify-client

## Table of contents

### Enumerations

- [DownloadItemsFormat](enums/DownloadItemsFormat.md)
- [PlatformFeature](enums/PlatformFeature.md)
- [ScheduleActions](enums/ScheduleActions.md)
- [WebhookDispatchStatus](enums/WebhookDispatchStatus.md)

### Classes

- [ActorClient](classes/ActorClient.md)
- [ActorCollectionClient](classes/ActorCollectionClient.md)
- [ApifyApiError](classes/ApifyApiError.md)
- [ApifyClient](classes/ApifyClient.md)
- [BuildClient](classes/BuildClient.md)
- [BuildCollectionClient](classes/BuildCollectionClient.md)
- [DatasetClient](classes/DatasetClient.md)
- [DatasetCollectionClient](classes/DatasetCollectionClient.md)
- [KeyValueStoreClient](classes/KeyValueStoreClient.md)
- [KeyValueStoreCollectionClient](classes/KeyValueStoreCollectionClient.md)
- [LogClient](classes/LogClient.md)
- [RequestQueueClient](classes/RequestQueueClient.md)
- [RequestQueueCollectionClient](classes/RequestQueueCollectionClient.md)
- [RunClient](classes/RunClient.md)
- [RunCollectionClient](classes/RunCollectionClient.md)
- [ScheduleClient](classes/ScheduleClient.md)
- [ScheduleCollectionClient](classes/ScheduleCollectionClient.md)
- [TaskClient](classes/TaskClient.md)
- [TaskCollectionClient](classes/TaskCollectionClient.md)
- [UserClient](classes/UserClient.md)
- [WebhookClient](classes/WebhookClient.md)
- [WebhookCollectionClient](classes/WebhookCollectionClient.md)
- [WebhookDispatchClient](classes/WebhookDispatchClient.md)
- [WebhookDispatchCollectionClient](classes/WebhookDispatchCollectionClient.md)

### Interfaces

- [Actor](interfaces/Actor.md)
- [ActorBuildOptions](interfaces/ActorBuildOptions.md)
- [ActorCollectionCreateOptions](interfaces/ActorCollectionCreateOptions.md)
- [ActorCollectionListItem](interfaces/ActorCollectionListItem.md)
- [ActorCollectionListOptions](interfaces/ActorCollectionListOptions.md)
- [ActorDefaultRunOptions](interfaces/ActorDefaultRunOptions.md)
- [ActorExampleRunInput](interfaces/ActorExampleRunInput.md)
- [ActorLastRunOptions](interfaces/ActorLastRunOptions.md)
- [ActorRun](interfaces/ActorRun.md)
- [ActorRunMeta](interfaces/ActorRunMeta.md)
- [ActorRunOptions](interfaces/ActorRunOptions.md)
- [ActorRunStats](interfaces/ActorRunStats.md)
- [ActorStartOptions](interfaces/ActorStartOptions.md)
- [ActorStats](interfaces/ActorStats.md)
- [ActorTaggedBuild](interfaces/ActorTaggedBuild.md)
- [ActorTaggedBuilds](interfaces/ActorTaggedBuilds.md)
- [ApifyClientOptions](interfaces/ApifyClientOptions.md)
- [Build](interfaces/Build.md)
- [BuildClientGetOptions](interfaces/BuildClientGetOptions.md)
- [BuildClientWaitForFinishOptions](interfaces/BuildClientWaitForFinishOptions.md)
- [BuildCollectionClientListOptions](interfaces/BuildCollectionClientListOptions.md)
- [BuildMeta](interfaces/BuildMeta.md)
- [BuildOptions](interfaces/BuildOptions.md)
- [BuildStats](interfaces/BuildStats.md)
- [Dataset](interfaces/Dataset.md)
- [DatasetClientDownloadItemsOptions](interfaces/DatasetClientDownloadItemsOptions.md)
- [DatasetClientListItemOptions](interfaces/DatasetClientListItemOptions.md)
- [DatasetClientUpdateOptions](interfaces/DatasetClientUpdateOptions.md)
- [DatasetCollectionClientGetOrCreateOptions](interfaces/DatasetCollectionClientGetOrCreateOptions.md)
- [DatasetCollectionClientListOptions](interfaces/DatasetCollectionClientListOptions.md)
- [DatasetStats](interfaces/DatasetStats.md)
- [KeyValueClientGetRecordOptions](interfaces/KeyValueClientGetRecordOptions.md)
- [KeyValueClientListKeysOptions](interfaces/KeyValueClientListKeysOptions.md)
- [KeyValueClientListKeysResult](interfaces/KeyValueClientListKeysResult.md)
- [KeyValueClientUpdateOptions](interfaces/KeyValueClientUpdateOptions.md)
- [KeyValueListItem](interfaces/KeyValueListItem.md)
- [KeyValueStore](interfaces/KeyValueStore.md)
- [KeyValueStoreCollectionClientGetOrCreateOptions](interfaces/KeyValueStoreCollectionClientGetOrCreateOptions.md)
- [KeyValueStoreCollectionClientListOptions](interfaces/KeyValueStoreCollectionClientListOptions.md)
- [KeyValueStoreRecord](interfaces/KeyValueStoreRecord.md)
- [KeyValueStoreStats](interfaces/KeyValueStoreStats.md)
- [PaginatedList](interfaces/PaginatedList.md)
- [ProxyGroup](interfaces/ProxyGroup.md)
- [RequestQueue](interfaces/RequestQueue.md)
- [RequestQueueClientAddRequestOptions](interfaces/RequestQueueClientAddRequestOptions.md)
- [RequestQueueClientAddRequestResult](interfaces/RequestQueueClientAddRequestResult.md)
- [RequestQueueClientBatchAddRequestWithRetriesOptions](interfaces/RequestQueueClientBatchAddRequestWithRetriesOptions.md)
- [RequestQueueClientBatchRequestsOperationResult](interfaces/RequestQueueClientBatchRequestsOperationResult.md)
- [RequestQueueClientDeleteRequestLockOptions](interfaces/RequestQueueClientDeleteRequestLockOptions.md)
- [RequestQueueClientListAndLockHeadOptions](interfaces/RequestQueueClientListAndLockHeadOptions.md)
- [RequestQueueClientListAndLockHeadResult](interfaces/RequestQueueClientListAndLockHeadResult.md)
- [RequestQueueClientListHeadOptions](interfaces/RequestQueueClientListHeadOptions.md)
- [RequestQueueClientListHeadResult](interfaces/RequestQueueClientListHeadResult.md)
- [RequestQueueClientListItem](interfaces/RequestQueueClientListItem.md)
- [RequestQueueClientProlongRequestLockOptions](interfaces/RequestQueueClientProlongRequestLockOptions.md)
- [RequestQueueClientProlongRequestLockResult](interfaces/RequestQueueClientProlongRequestLockResult.md)
- [RequestQueueClientRequestSchema](interfaces/RequestQueueClientRequestSchema.md)
- [RequestQueueClientUpdateOptions](interfaces/RequestQueueClientUpdateOptions.md)
- [RequestQueueCollectionListOptions](interfaces/RequestQueueCollectionListOptions.md)
- [RequestQueueStats](interfaces/RequestQueueStats.md)
- [RequestQueueUserOptions](interfaces/RequestQueueUserOptions.md)
- [RunAbortOptions](interfaces/RunAbortOptions.md)
- [RunCollectionListOptions](interfaces/RunCollectionListOptions.md)
- [RunGetOptions](interfaces/RunGetOptions.md)
- [RunMetamorphOptions](interfaces/RunMetamorphOptions.md)
- [RunResurrectOptions](interfaces/RunResurrectOptions.md)
- [RunWaitForFinishOptions](interfaces/RunWaitForFinishOptions.md)
- [Schedule](interfaces/Schedule.md)
- [ScheduleActionRunActor](interfaces/ScheduleActionRunActor.md)
- [ScheduleActionRunActorTask](interfaces/ScheduleActionRunActorTask.md)
- [ScheduleCollectionListOptions](interfaces/ScheduleCollectionListOptions.md)
- [ScheduledActorRunInput](interfaces/ScheduledActorRunInput.md)
- [ScheduledActorRunOptions](interfaces/ScheduledActorRunOptions.md)
- [Task](interfaces/Task.md)
- [TaskCollectionListOptions](interfaces/TaskCollectionListOptions.md)
- [TaskCreateData](interfaces/TaskCreateData.md)
- [TaskLastRunOptions](interfaces/TaskLastRunOptions.md)
- [TaskOptions](interfaces/TaskOptions.md)
- [TaskStats](interfaces/TaskStats.md)
- [User](interfaces/User.md)
- [UserPlan](interfaces/UserPlan.md)
- [UserProxy](interfaces/UserProxy.md)
- [Webhook](interfaces/Webhook.md)
- [WebhookAnyRunOfActorCondition](interfaces/WebhookAnyRunOfActorCondition.md)
- [WebhookAnyRunOfActorTaskCondition](interfaces/WebhookAnyRunOfActorTaskCondition.md)
- [WebhookCertainRunCondition](interfaces/WebhookCertainRunCondition.md)
- [WebhookCollectionListOptions](interfaces/WebhookCollectionListOptions.md)
- [WebhookDispatch](interfaces/WebhookDispatch.md)
- [WebhookDispatchCall](interfaces/WebhookDispatchCall.md)
- [WebhookDispatchCollectionListOptions](interfaces/WebhookDispatchCollectionListOptions.md)
- [WebhookIdempotencyKey](interfaces/WebhookIdempotencyKey.md)
- [WebhookStats](interfaces/WebhookStats.md)

### Type aliases

- [ActorCollectionListResult](modules.md#actorcollectionlistresult)
- [ActorUpdateOptions](modules.md#actorupdateoptions)
- [AllowedHttpMethods](modules.md#allowedhttpmethods)
- [BuildCollectionClientListItem](modules.md#buildcollectionclientlistitem)
- [BuildCollectionClientListResult](modules.md#buildcollectionclientlistresult)
- [DatasetCollectionClientListResult](modules.md#datasetcollectionclientlistresult)
- [KeyValueStoreCollectionListResult](modules.md#keyvaluestorecollectionlistresult)
- [RequestQueueClientGetRequestResult](modules.md#requestqueueclientgetrequestresult)
- [RequestQueueClientRequestToDelete](modules.md#requestqueueclientrequesttodelete)
- [RequestQueueCollectionListResult](modules.md#requestqueuecollectionlistresult)
- [ReturnTypeFromOptions](modules.md#returntypefromoptions)
- [ScheduleAction](modules.md#scheduleaction)
- [ScheduleUpdateData](modules.md#scheduleupdatedata)
- [TaskList](modules.md#tasklist)
- [TaskStartOptions](modules.md#taskstartoptions)
- [TaskUpdateData](modules.md#taskupdatedata)
- [WebhookCondition](modules.md#webhookcondition)
- [WebhookEventType](modules.md#webhookeventtype)
- [WebhookUpdateData](modules.md#webhookupdatedata)

## Type aliases

### <a id="actorcollectionlistresult" name="actorcollectionlistresult"></a> ActorCollectionListResult

Ƭ **ActorCollectionListResult**: [`PaginatedList`](interfaces/PaginatedList.md)<[`ActorCollectionListItem`](interfaces/ActorCollectionListItem.md)\>

___

### <a id="actorupdateoptions" name="actorupdateoptions"></a> ActorUpdateOptions

Ƭ **ActorUpdateOptions**: `Pick`<[`Actor`](interfaces/Actor.md), ``"name"`` \| ``"isPublic"`` \| ``"versions"`` \| ``"description"`` \| ``"title"`` \| ``"restartOnError"``\>

___

### <a id="allowedhttpmethods" name="allowedhttpmethods"></a> AllowedHttpMethods

Ƭ **AllowedHttpMethods**: ``"GET"`` \| ``"HEAD"`` \| ``"POST"`` \| ``"PUT"`` \| ``"DELETE"`` \| ``"TRACE"`` \| ``"OPTIONS"`` \| ``"CONNECT"`` \| ``"PATCH"``

___

### <a id="buildcollectionclientlistitem" name="buildcollectionclientlistitem"></a> BuildCollectionClientListItem

Ƭ **BuildCollectionClientListItem**: `Required`<`Pick`<[`Build`](interfaces/Build.md), ``"id"`` \| ``"status"`` \| ``"startedAt"`` \| ``"finishedAt"``\>\> & `Partial`<`Pick`<[`Build`](interfaces/Build.md), ``"meta"``\>\>

___

### <a id="buildcollectionclientlistresult" name="buildcollectionclientlistresult"></a> BuildCollectionClientListResult

Ƭ **BuildCollectionClientListResult**: [`PaginatedList`](interfaces/PaginatedList.md)<[`BuildCollectionClientListItem`](modules.md#buildcollectionclientlistitem)\>

___

### <a id="datasetcollectionclientlistresult" name="datasetcollectionclientlistresult"></a> DatasetCollectionClientListResult

Ƭ **DatasetCollectionClientListResult**: [`PaginatedList`](interfaces/PaginatedList.md)<[`Dataset`](interfaces/Dataset.md)\>

___

### <a id="keyvaluestorecollectionlistresult" name="keyvaluestorecollectionlistresult"></a> KeyValueStoreCollectionListResult

Ƭ **KeyValueStoreCollectionListResult**: `Omit`<[`KeyValueStore`](interfaces/KeyValueStore.md), ``"stats"``\> & { `username?`: `string`  }

___

### <a id="requestqueueclientgetrequestresult" name="requestqueueclientgetrequestresult"></a> RequestQueueClientGetRequestResult

Ƭ **RequestQueueClientGetRequestResult**: `Omit`<[`RequestQueueClientListItem`](interfaces/RequestQueueClientListItem.md), ``"retryCount"``\>

___

### <a id="requestqueueclientrequesttodelete" name="requestqueueclientrequesttodelete"></a> RequestQueueClientRequestToDelete

Ƭ **RequestQueueClientRequestToDelete**: `Pick`<[`RequestQueueClientRequestSchema`](interfaces/RequestQueueClientRequestSchema.md), ``"id"``\> \| `Pick`<[`RequestQueueClientRequestSchema`](interfaces/RequestQueueClientRequestSchema.md), ``"uniqueKey"``\>

___

### <a id="requestqueuecollectionlistresult" name="requestqueuecollectionlistresult"></a> RequestQueueCollectionListResult

Ƭ **RequestQueueCollectionListResult**: [`PaginatedList`](interfaces/PaginatedList.md)<[`RequestQueue`](interfaces/RequestQueue.md) & { `username?`: `string`  }\> & { `unnamed`: `boolean`  }

___

### <a id="returntypefromoptions" name="returntypefromoptions"></a> ReturnTypeFromOptions

Ƭ **ReturnTypeFromOptions**<`Options`\>: `Options`[``"stream"``] extends ``true`` ? `ReadableStream` : `Options`[``"buffer"``] extends ``true`` ? `Buffer` : `JsonValue`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Options` | extends [`KeyValueClientGetRecordOptions`](interfaces/KeyValueClientGetRecordOptions.md) |

___

### <a id="scheduleaction" name="scheduleaction"></a> ScheduleAction

Ƭ **ScheduleAction**: [`ScheduleActionRunActor`](interfaces/ScheduleActionRunActor.md) \| [`ScheduleActionRunActorTask`](interfaces/ScheduleActionRunActorTask.md)

___

### <a id="scheduleupdatedata" name="scheduleupdatedata"></a> ScheduleUpdateData

Ƭ **ScheduleUpdateData**: `Partial`<`Pick`<[`Schedule`](interfaces/Schedule.md), ``"name"`` \| ``"cronExpression"`` \| ``"timezone"`` \| ``"isEnabled"`` \| ``"isExclusive"`` \| ``"description"`` \| ``"actions"``\>\>

___

### <a id="tasklist" name="tasklist"></a> TaskList

Ƭ **TaskList**: `Omit`<[`Task`](interfaces/Task.md), ``"options"`` \| ``"input"``\>

___

### <a id="taskstartoptions" name="taskstartoptions"></a> TaskStartOptions

Ƭ **TaskStartOptions**: `Omit`<[`ActorStartOptions`](interfaces/ActorStartOptions.md), ``"contentType"``\>

___

### <a id="taskupdatedata" name="taskupdatedata"></a> TaskUpdateData

Ƭ **TaskUpdateData**: `Partial`<`Pick`<[`Task`](interfaces/Task.md), ``"name"`` \| ``"description"`` \| ``"options"`` \| ``"input"``\>\>

___

### <a id="webhookcondition" name="webhookcondition"></a> WebhookCondition

Ƭ **WebhookCondition**: [`WebhookAnyRunOfActorCondition`](interfaces/WebhookAnyRunOfActorCondition.md) \| [`WebhookAnyRunOfActorTaskCondition`](interfaces/WebhookAnyRunOfActorTaskCondition.md) \| [`WebhookCertainRunCondition`](interfaces/WebhookCertainRunCondition.md)

___

### <a id="webhookeventtype" name="webhookeventtype"></a> WebhookEventType

Ƭ **WebhookEventType**: typeof `WEBHOOK_EVENT_TYPES`[keyof typeof `WEBHOOK_EVENT_TYPES`]

___

### <a id="webhookupdatedata" name="webhookupdatedata"></a> WebhookUpdateData

Ƭ **WebhookUpdateData**: `Partial`<`Pick`<[`Webhook`](interfaces/Webhook.md), ``"isAdHoc"`` \| ``"eventTypes"`` \| ``"condition"`` \| ``"ignoreSslErrors"`` \| ``"doNotRetry"`` \| ``"requestUrl"`` \| ``"payloadTemplate"``\>\> & [`WebhookIdempotencyKey`](interfaces/WebhookIdempotencyKey.md)
