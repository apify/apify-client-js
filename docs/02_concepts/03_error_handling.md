---
sidebar_label: 'Error Handling'
title: 'Error Handling'
description: 'Learn how to handle errors and exceptions when using the Apify Client, including retry logic and common HTTP status codes.'
---

## ApifyApiError Class

When an API request fails, the Apify Client throws an `ApifyApiError` exception. This error class wraps the JSON errors returned by the API and enriches them with additional context for easier debugging.

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'MY-APIFY-TOKEN' });

try {
    const { items } = await client.dataset('non-existing-dataset-id').listItems();
} catch (error) {
    // The error is an instance of ApifyApiError
    const { message, type, statusCode, clientMethod, path } = error;

    // Log error details for debugging
    console.log({
        message,      // Human-readable error message
        statusCode,   // HTTP status code (404, 401, 500, etc.)
        clientMethod, // Client method that failed
        type,         // Error type identifier
        path          // API endpoint path
    });
}
```

## Error Properties

The `ApifyApiError` provides these useful properties:

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Human-readable error description |
| `statusCode` | `number` | HTTP status code (e.g., 404, 401, 500) |
| `type` | `string` | Error type identifier from the API |
| `clientMethod` | `string` | The client method that threw the error |
| `path` | `string` | The API endpoint path that was called |
| `originalError` | `object` | The original error response from the API |

## Common HTTP Status Codes

### 401 Unauthorized

Authentication failed or API token is invalid:

```js
try {
    await client.user().get();
} catch (error) {
    if (error.statusCode === 401) {
        console.error('Authentication failed: Check your API token');
        // Handle invalid credentials
    }
}
```

### 404 Not Found

The requested resource doesn't exist:

```js
try {
    const actor = await client.actor('non-existent-actor').get();
} catch (error) {
    if (error.statusCode === 404) {
        console.error('Actor not found');
        // Handle missing resource
    }
}
```

### 429 Too Many Requests

Rate limit exceeded:

```js
try {
    await client.actor('my-actor').start();
} catch (error) {
    if (error.statusCode === 429) {
        console.error('Rate limit exceeded. Please wait before retrying.');
        // Implement exponential backoff
    }
}
```

### 500 Internal Server Error

Server-side error occurred:

```js
try {
    await client.actor('my-actor').start();
} catch (error) {
    if (error.statusCode === 500) {
        console.error('Server error. Please try again later.');
        // Implement retry logic
    }
}
```

## Comprehensive Error Handling Pattern

Here's a robust error handling pattern for production code:

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

async function runActorSafely(actorId, input) {
    try {
        const run = await client.actor(actorId).call(input);
        return { success: true, data: run };
    } catch (error) {
        // Handle specific error cases
        switch (error.statusCode) {
            case 401:
                return {
                    success: false,
                    error: 'Authentication failed. Check your API token.'
                };

            case 404:
                return {
                    success: false,
                    error: `Actor '${actorId}' not found.`
                };

            case 429:
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please retry later.',
                    retryable: true
                };

            case 500:
            case 502:
            case 503:
                return {
                    success: false,
                    error: 'Server error occurred. Please retry.',
                    retryable: true
                };

            default:
                return {
                    success: false,
                    error: error.message || 'Unknown error occurred',
                    details: {
                        statusCode: error.statusCode,
                        type: error.type,
                        path: error.path
                    }
                };
        }
    }
}

// Usage
const result = await runActorSafely('john-doe/my-actor', { url: 'https://example.com' });

if (result.success) {
    console.log('Actor run successful:', result.data);
} else {
    console.error('Actor run failed:', result.error);

    if (result.retryable) {
        // Implement retry logic
        console.log('This error is retryable. Consider retrying...');
    }
}
```

## Network Error Handling

Network errors (connection failures, timeouts) are also thrown as errors:

```js
try {
    await client.actor('my-actor').start();
} catch (error) {
    if (error.code === 'ECONNREFUSED') {
        console.error('Cannot connect to Apify API');
    } else if (error.code === 'ETIMEDOUT') {
        console.error('Request timed out');
    } else if (!error.statusCode) {
        console.error('Network error:', error.message);
    }
}
```

## Retry Logic with Exponential Backoff

For transient errors, implement retry logic with exponential backoff:

```js
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Only retry on specific errors
            if (error.statusCode === 429 || error.statusCode >= 500) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Don't retry on client errors (4xx except 429)
                throw error;
            }
        }
    }

    throw lastError;
}

// Usage
try {
    const run = await retryWithBackoff(
        () => client.actor('my-actor').start(),
        3,  // max retries
        1000 // initial delay in ms
    );
    console.log('Actor started:', run.id);
} catch (error) {
    console.error('Failed after retries:', error.message);
}
```

## Validation Errors

The API returns validation errors when input doesn't meet requirements:

```js
try {
    await client.actors().create({
        // Missing required 'name' field
    });
} catch (error) {
    if (error.statusCode === 400) {
        console.error('Validation error:', error.message);
        // Handle validation failure
    }
}
```

## Graceful Degradation

Implement graceful degradation for non-critical operations:

```js
async function getActorWithFallback(actorId) {
    try {
        return await client.actor(actorId).get();
    } catch (error) {
        console.warn(`Failed to fetch actor: ${error.message}`);

        // Return fallback data
        return {
            id: actorId,
            name: 'Unknown Actor',
            unavailable: true
        };
    }
}
```

## Debugging Tips

Enable detailed logging to debug errors:

```js
const client = new ApifyClient({
    token: 'MY-APIFY-TOKEN',
    // Add custom request interceptor for debugging
});

try {
    await client.actor('my-actor').start();
} catch (error) {
    // Log full error details
    console.error('Full error:', JSON.stringify({
        message: error.message,
        statusCode: error.statusCode,
        type: error.type,
        clientMethod: error.clientMethod,
        path: error.path,
        stack: error.stack
    }, null, 2));
}
```

## Next Steps

- Learn about [retries](04_retries.md) for automatic retry handling
- See [authentication](01_authentication.md) for handling auth errors
- Explore [client architecture](02_client_architecture.md) to understand error contexts
