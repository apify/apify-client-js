---
sidebar_label: 'Authentication'
title: 'Authentication'
description: 'Learn how to authenticate with the Apify API using API tokens and manage credentials securely in your applications.'
---

## API Token Authentication

To use the Apify Client, you need an [API token](https://docs.apify.com/platform/integrations/api#api-token). The API token authorizes your requests to the Apify API and identifies your account.

### Getting Your API Token

You can find your API token in the [Integrations](https://console.apify.com/account/integrations) tab in Apify Console:

1. Log in to [Apify Console](https://console.apify.com/)
2. Navigate to **Settings** → **Integrations**
3. Copy your API token from the **Personal API tokens** section

### Initializing the Client

Pass your API token to the `ApifyClient` constructor:

```js
import { ApifyClient } from 'apify-client';

// Initialize the client with your API token
const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
});
```

### Using Environment Variables

For better security, store your API token in an environment variable rather than hardcoding it:

```js
import { ApifyClient } from 'apify-client';

// Initialize with token from environment variable
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});
```

Set the environment variable before running your script:

```bash
export APIFY_TOKEN='MY-APIFY-TOKEN'
node your-script.js
```

:::tip Best Practice

The Apify Client automatically reads the `APIFY_TOKEN` environment variable if you don't provide a token explicitly:

```js
// This will use process.env.APIFY_TOKEN automatically
const client = new ApifyClient();
```

:::

## Token Storage Best Practices

Follow these security guidelines when working with API tokens:

- **Never commit tokens to version control** - Use environment variables or secret management tools
- **Don't expose tokens on the client side** - Only use API tokens in server-side code
- **Rotate tokens regularly** - Generate new tokens periodically and revoke old ones
- **Use separate tokens for different projects** - Create multiple tokens for better access control
- **Store tokens securely** - Use encrypted storage or secure secret management services

:::warning Secure Access

The API token is used to authorize your requests to the Apify API. You can be charged for the usage of the underlying services, so do not share your API token with untrusted parties or expose it on the client side of your applications.

:::

## Handling Authentication Errors

If authentication fails, the client will throw an error with a `401 Unauthorized` status code:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'invalid-token' });

try {
    await client.user().get();
} catch (error) {
    if (error.statusCode === 401) {
        console.error('Authentication failed: Invalid API token');
    }
}
```

Common authentication issues:

- **Invalid token format** - Ensure you copied the entire token
- **Expired token** - Tokens can be revoked; generate a new one
- **Missing token** - Make sure the token is properly set
- **Wrong token** - Verify you're using the correct token for your account

## Next Steps

- Learn about [client architecture](02_client_architecture.md) to understand how clients work
- See [error handling](03_error_handling.md) for comprehensive error management strategies
