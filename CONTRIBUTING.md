# Contributing to apify-client

Thank you for your interest in contributing to the official JavaScript/TypeScript client for the Apify API. This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Adding New Resource Clients](#adding-new-resource-clients)

## Development Setup

### Prerequisites

- Node.js 22+ (LTS recommended)
- pnpm 10+

### Installation

1. Fork and clone the repository:

    ```bash
    git clone git@github.com:<your-username>/apify-client-js.git
    cd apify-client-js
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Build the project:

    ```bash
    pnpm build
    ```

4. Run the tests to verify everything works:
    ```bash
    pnpm test
    ```

## Project Structure

```
src/
├── apify_client.ts              # Main client class (entry point)
├── http_client.ts               # Low-level HTTP layer (Axios-based)
├── apify_api_error.ts           # Custom error class
├── utils.ts                     # Utility functions
├── generated/
│   └── api.ts                   # Types generated from the OpenAPI specification (do not edit)
├── base/
│   ├── api_client.ts            # Base for all clients
│   ├── resource_client.ts       # Base for single-resource clients
│   └── resource_collection_client.ts  # Base for collection clients
└── resource_clients/            # Resource-specific clients
    ├── actor.ts                 # Single actor operations
    ├── actor_collection.ts      # Actor list/create operations
    ├── dataset.ts
    ├── dataset_collection.ts
    └── ...

test/
├── *.test.ts                    # Test files
├── _helper.ts                   # Test utilities
└── mock_server/                 # Mock API server for testing
    ├── server.ts
    └── routes/                  # Mock API routes

scripts/
├── openapi_spec.mts             # Downloads the published OpenAPI specification
├── generate_types.mts           # Generates src/generated/api.ts from it
└── spec_transform.mts           # Spec postprocessing the generator applies
```

### Key Patterns

**Collection vs Resource Clients**: Each API resource has two client types:

- **Collection client** (`*_collection.ts`): Operations on collections (list, create)
- **Resource client** (e.g., `actor.ts`): Operations on single resources (get, update, delete)

**Safe ID Handling**: IDs like `username/actor-name` are automatically converted to `username~actor-name` for URL paths.

**Automatic Retries**: The client retries failed requests with exponential backoff (network errors, 500+, 429).

**Date Parsing**: Fields ending in "At" are automatically converted to Date objects.

## Development Workflow

### Available Scripts

```bash
# Build
pnpm build                 # Full build (Node + browser bundle)
pnpm build:node            # TypeScript compilation only
pnpm build:browser         # RSBuild browser/UMD bundle
pnpm clean                 # Remove dist directory

# Testing
pnpm test                  # Build and run the unit tests
pnpm test:integration      # Run the integration tests against the live API
pnpm test:all              # Build and run both tiers
pnpm tsc-check-tests       # TypeScript check test files
pnpm tsc-check-scripts     # TypeScript check maintainer scripts

# API specification (needs Node 22.18+, for native TypeScript support)
pnpm generate:types        # Regenerate src/generated/api.ts from the published specification
pnpm spec:fetch            # Only download the specification, into git-ignored tmp/

# Linting & Formatting
pnpm lint                  # Oxlint check (type-aware)
pnpm lint:fix              # Auto-fix linting issues
pnpm format                # oxfmt format
pnpm format:check          # oxfmt check
```

### Build Output

The build produces multiple formats:

- CommonJS: `dist/index.js`
- ES Module: `dist/index.mjs`
- TypeScript definitions: `dist/index.d.ts`
- Browser bundle (UMD): `dist/bundle.js`

## Code Style

This project uses [oxlint](https://oxc.rs/docs/guide/usage/linter) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for code linting and formatting.

### Configuration

- **EditorConfig**: `.editorconfig` - 4 spaces, UTF-8, LF line endings
- **oxfmt**: `.oxfmtrc.json` - 120 char line width
- **oxlint**: `oxlint.config.ts` - Based on `@apify/oxlint-config`

### Guidelines

- Use TypeScript for all source code
- Use 4 spaces for indentation
- Maximum line length is 120 characters
- Use single quotes for strings
- Add trailing commas in multiline structures
- Export types and interfaces alongside implementations
- Avoid `any` types where possible (though the oxlint rule is disabled)

### Before Committing

Always run:

```bash
pnpm lint:fix
pnpm format
```

## Testing

Tests are written using [Vitest](https://vitest.dev/) and split into two projects:

- **`unit`** - everything outside `test/integration/`, run against a mock server. Offline and fast.
- **`integration`** - `test/integration/`, run against the live Apify API with a real token.

### Running Tests

```bash
pnpm test                             # Full build + unit tests
pnpm vitest run --project unit        # Unit tests only (requires prior build)
pnpm vitest --watch --project unit    # Watch mode
pnpm vitest run --project unit actors # Run specific test file
```

### Running the Integration Tests

They create and delete real resources under a test user, so they need an API token:

```bash
export APIFY_TEST_USER_API_TOKEN=...   # Token of the user the tests run as
pnpm test:integration
```

Set `APIFY_INTEGRATION_TESTS_API_URL` to point the tier at a different deployment, such as staging.
Without `APIFY_TEST_USER_API_TOKEN` every integration test fails in its `beforeAll` hook - run
`pnpm test` instead if you only want the offline tier.

In CI the tier runs on pull requests opened from this repository. It is skipped for pull requests
from forks, where repository secrets are unavailable, and can be triggered by hand via
`workflow_dispatch`.

### Test Structure

Tests use a mock server located in `test/mock_server/` that simulates the Apify API:

```typescript
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { ApifyClient } from 'apify-client';
import { mockServer } from './mock_server/server';

describe('MyResource methods', () => {
    let baseUrl: string;
    let client: ApifyClient;

    beforeAll(async () => {
        const server = await mockServer.start();
        baseUrl = `http://localhost:${server.address().port}`;
    });

    afterAll(async () => {
        await mockServer.close();
    });

    beforeEach(() => {
        client = new ApifyClient({
            baseUrl,
            maxRetries: 0,
            token: 'test-token',
        });
    });

    test('get() works', async () => {
        const result = await client.myResource('id').get();
        expect(result).toBeDefined();
    });
});
```

### Adding Mock Routes

Add new mock routes in `test/mock_server/routes/`:

```typescript
// test/mock_server/routes/my_resource.ts
import { Router } from 'express';

export function addMyResourceRoutes(router: Router) {
    router.get('/v2/my-resources/:id', (req, res) => {
        res.json({ data: { id: req.params.id } });
    });
}
```

### Test Timeout

Configured in `vitest.config.mts`: 20 seconds for unit tests, 300 seconds for integration tests,
where Actor runs and builds dominate the runtime.

## Pull Request Guidelines

### Before Submitting

1. **Fork the repository** and create a feature branch from `master`
2. **Write/update tests** for any new functionality
3. **Run the full test suite**: `pnpm test`
4. **Run linting**: `pnpm lint`
5. **Run formatting**: `pnpm format:check`
6. **Update TypeScript types** if you're adding/modifying API responses

### PR Title Format

Use conventional commit format:

- `feat: add new method to DatasetClient`
- `fix: handle edge case in pagination`
- `docs: update README examples`
- `refactor: simplify error handling`
- `test: add missing tests for actor methods`

### PR Description

Include:

- What the change does
- Why it's needed
- Any breaking changes
- Link to related issues

### Review Process

1. All PRs require at least one approval
2. CI must pass (tests, linting, type checking)
3. Squash and merge is preferred

## Adding New Resource Clients

When adding support for a new API resource:

### 1. Create the Resource Client

```typescript
// src/resource_clients/my_resource.ts
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceClient } from '../base/resource_client';

export class MyResourceClient extends ResourceClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'my-resources',
            ...options,
        });
    }

    async get(): Promise<MyResource | undefined> {
        return this._get();
    }

    async update(newFields: MyResourceUpdate): Promise<MyResource> {
        return this._update(newFields);
    }

    async delete(): Promise<void> {
        return this._delete();
    }
}
```

### 2. Create the Collection Client

```typescript
// src/resource_clients/my_resource_collection.ts
import { ApiClientSubResourceOptions } from '../base/api_client';
import { ResourceCollectionClient } from '../base/resource_collection_client';
import { PaginatedList } from '../utils';

export class MyResourceCollectionClient extends ResourceCollectionClient {
    constructor(options: ApiClientSubResourceOptions) {
        super({
            resourcePath: 'my-resources',
            ...options,
        });
    }

    async list(options?: MyResourceListOptions): Promise<PaginatedList<MyResource>> {
        return this._list(options);
    }

    async create(resource: MyResourceCreate): Promise<MyResource> {
        return this._create(resource);
    }
}
```

### 3. Add to ApifyClient

```typescript
// In src/apify_client.ts
myResource(id: string): MyResourceClient {
    return new MyResourceClient(this._subResourceOptions({ id }));
}

myResources(): MyResourceCollectionClient {
    return new MyResourceCollectionClient(this._options());
}
```

### 4. Export Types and Clients

```typescript
// In src/index.ts
export { MyResourceClient } from './resource_clients/my_resource';
export { MyResourceCollectionClient } from './resource_clients/my_resource_collection';
export type { MyResource, MyResourceCreate, MyResourceUpdate } from './resource_clients/my_resource';
```

### 5. Add Tests

Create `test/my_resource.test.ts` with comprehensive tests and add mock routes in `test/mock_server/routes/`.

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues and PRs before creating new ones
- For general questions about Apify, visit [Apify Documentation](https://docs.apify.com/)

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
