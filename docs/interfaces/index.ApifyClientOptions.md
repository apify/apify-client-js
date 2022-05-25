# Interface: ApifyClientOptions

[index](../modules/index.md).ApifyClientOptions

## Table of contents

### Properties

- [baseUrl](index.ApifyClientOptions.md#baseurl)
- [maxRetries](index.ApifyClientOptions.md#maxretries)
- [minDelayBetweenRetriesMillis](index.ApifyClientOptions.md#mindelaybetweenretriesmillis)
- [requestInterceptors](index.ApifyClientOptions.md#requestinterceptors)
- [timeoutSecs](index.ApifyClientOptions.md#timeoutsecs)
- [token](index.ApifyClientOptions.md#token)

## Properties

### <a id="baseurl" name="baseurl"></a> baseUrl

• `Optional` **baseUrl**: `string`

**`default`** https://api.apify.com

___

### <a id="maxretries" name="maxretries"></a> maxRetries

• `Optional` **maxRetries**: `number`

**`default`** 8

___

### <a id="mindelaybetweenretriesmillis" name="mindelaybetweenretriesmillis"></a> minDelayBetweenRetriesMillis

• `Optional` **minDelayBetweenRetriesMillis**: `number`

**`default`** 500

___

### <a id="requestinterceptors" name="requestinterceptors"></a> requestInterceptors

• `Optional` **requestInterceptors**: (`undefined` \| (`value`: `ApifyRequestConfig`) => `unknown`)[]

**`default`** []

___

### <a id="timeoutsecs" name="timeoutsecs"></a> timeoutSecs

• `Optional` **timeoutSecs**: `number`

**`default`** 360

___

### <a id="token" name="token"></a> token

• `Optional` **token**: `string`
