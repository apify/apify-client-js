# Interface: WebhookDispatch

## Table of contents

### Properties

- [calls](WebhookDispatch.md#calls)
- [createdAt](WebhookDispatch.md#createdat)
- [eventType](WebhookDispatch.md#eventtype)
- [id](WebhookDispatch.md#id)
- [status](WebhookDispatch.md#status)
- [userId](WebhookDispatch.md#userid)
- [webhook](WebhookDispatch.md#webhook)
- [webhookId](WebhookDispatch.md#webhookid)

## Properties

### <a id="calls" name="calls"></a> calls

• **calls**: [`WebhookDispatchCall`](WebhookDispatchCall.md)[]

___

### <a id="createdat" name="createdat"></a> createdAt

• **createdAt**: `Date`

___

### <a id="eventtype" name="eventtype"></a> eventType

• **eventType**: [`WebhookEventType`](../modules.md#webhookeventtype)

___

### <a id="id" name="id"></a> id

• **id**: `string`

___

### <a id="status" name="status"></a> status

• **status**: [`WebhookDispatchStatus`](../enums/WebhookDispatchStatus.md)

___

### <a id="userid" name="userid"></a> userId

• **userId**: `string`

___

### <a id="webhook" name="webhook"></a> webhook

• **webhook**: `Pick`<[`Webhook`](Webhook.md), ``"isAdHoc"`` \| ``"requestUrl"``\>

___

### <a id="webhookid" name="webhookid"></a> webhookId

• **webhookId**: `string`
