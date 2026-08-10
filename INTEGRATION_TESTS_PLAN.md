# Integration test suite for apify-client-js

Plan for porting the Python client's integration tier to the JS client, matching its setup, structure and
coverage. Target branch: `v3`.

Working doc — not intended to be committed. Drop it once the suite has run green against the live API a
few times and §3 and §12 are settled.

**Status: all four sub-phases are implemented.** `vitest list --project integration` reports **205 cases
across 16 files**, matching the estimate in §8. What is still outstanding is entirely in §3 — the suite has
never run against the live API, because the tokens do not exist yet. Until they do, the CI job is wired up
but every case fails at `makeClient()` with the missing-env-var error, which is the intended behaviour.

## 1. Goal

`apify-client-python` runs **392 integration cases** (193 test functions × sync/async) against the live Apify
API on every apify-org PR. `apify-client-js` runs **zero**. Everything in the JS suite talks to a local
express mock whose handlers return `{ data: { id: '<endpoint-id>' } }`, so no test has ever proven that the
client works against the real API.

This plan adds a `test/integration/` tier that mirrors Python's file-for-file, so the v3 rewrite has a real
safety net.

## 2. Baseline

| | Python | JS (v3) |
|---|---|---|
| Integration files | 17 (+ `conftest.py`) | 0 |
| Integration cases | 392 | 0 |
| Integration LOC | ~5,600 | 0 |
| Runner | `pytest`, `--numprocesses=16` | — |
| Gating | apify-org PRs, master push, dispatch | — |
| Secrets | 2 test-user tokens | none |
| Coverage upload | Codecov, `integration` flag | none |

Expected JS result: **~205 cases across 16 files**. Lower than 392 because JS has no sync/async split — the
same 193 behaviours, counted once, plus ~12 JS-only cases (see §8).

## 3. Prerequisites — blocking, needs someone with org access

1. **Two repo secrets.** Python uses `APIFY_TEST_USER_PYTHON_SDK_API_TOKEN` and
   `APIFY_TEST_USER_2_API_TOKEN`. For JS:
   - `APIFY_TEST_USER_JS_CLIENT_API_TOKEN` — new dedicated test user, mirroring the Python one. A separate
     user (not a shared one) matters: tests create, list and delete Actors/storages under `my=true`, so a
     shared account makes listing assertions racy.
   - `APIFY_TEST_USER_2_API_TOKEN` — needed only for the cross-user signature tests. Check whether the
     existing Python secret is org-scoped; if so, reuse the name, otherwise provision a second one.
2. Confirm the test account has enough compute-unit budget. The suite starts ~35 `apify/hello-world` runs
   per execution.

Until the secrets exist, everything below is implementable and runnable locally with env vars; the CI job
just skips.

## 4. Layout

Mirrors Python 1:1. Existing files stay put — this phase does not require moving the current unit tests.

```
test/
├── _helper.ts                     # existing, untouched
├── mock_server/                   # existing, untouched
├── *.test.ts                      # existing unit tests, untouched
└── integration/
    ├── _global_setup.ts           # session-scoped cross-user fixtures (conftest.py session scope)
    ├── _fixtures.ts               # client factories, env var names, token guards
    ├── _utils.ts                  # pollUntilCondition, getRandomResourceName, collectUntilPresent
    ├── apify_client.test.ts
    ├── actor.test.ts
    ├── actor_env_var.test.ts
    ├── actor_version.test.ts
    ├── build.test.ts
    ├── dataset.test.ts
    ├── key_value_store.test.ts
    ├── log.test.ts
    ├── request_queue.test.ts
    ├── run.test.ts
    ├── schedule.test.ts
    ├── store.test.ts
    ├── task.test.ts
    ├── user.test.ts
    ├── webhook.test.ts
    └── webhook_dispatch.test.ts
```

## 5. Config and scripts

`vitest.config.mts` gains two projects, so `vitest run` no longer sweeps integration tests into the default
run. This is the analogue of Python's `poe unit-tests` / `poe integration-tests` split.

```ts
export default defineConfig({
    resolve: { alias: { 'apify-client': resolve(__dirname, 'src') } },
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    include: ['test/**/*.test.ts'],
                    exclude: ['test/integration/**'],
                    globals: true,
                    environment: 'node',
                    testTimeout: 20_000,
                },
            },
            {
                test: {
                    name: 'integration',
                    include: ['test/integration/**/*.test.ts'],
                    globals: true,
                    environment: 'node',
                    // Actor runs and builds dominate; Python allows 1800s per test.
                    testTimeout: 300_000,
                    hookTimeout: 300_000,
                    globalSetup: ['test/integration/_global_setup.ts'],
                    // Cap concurrency so the suite does not rate-limit itself. Python uses 16 processes;
                    // start at 8 files and raise once the suite is observed to be stable.
                    maxWorkers: 8,
                    // No automatic retries — flakiness is fixed at the source (§10), same as Python.
                    retry: 0,
                },
            },
        ],
    },
});
```

`package.json` scripts:

```json
"test": "pnpm build && vitest run --project unit",
"test:integration": "vitest run --project integration",
"test:integration:cov": "vitest run --project integration --coverage --coverage.reportsDirectory=coverage-integration",
"test:all": "pnpm build && vitest run"
```

`test` keeps its current meaning (build + unit), so nothing in CI or contributor muscle memory changes.
`test:integration` deliberately skips `pnpm build` — integration tests import `src` through the alias and
never touch the browser bundle, which is the one place the current suite forces a build.

## 6. Fixtures and helpers

### 6.1 `_fixtures.ts` — client factories

Python's `conftest.py` provides `apify_client`, `apify_client_async`, `client`, `is_async`. JS collapses to
one client, so this is just factories plus a hard failure when the token is absent (matching Python's
`RuntimeError`).

```ts
export const TOKEN_ENV_VAR = 'APIFY_TEST_USER_API_TOKEN';
export const TOKEN_ENV_VAR_2 = 'APIFY_TEST_USER_2_API_TOKEN';
export const API_URL_ENV_VAR = 'APIFY_INTEGRATION_TESTS_API_URL';

function requireToken(envVar: string): string { /* throw with the same message shape as Python */ }

export function makeClient(): ApifyClient;   // primary test user
export function makeClient2(): ApifyClient;  // secondary user, cross-user permission tests
```

`baseUrl` comes from `APIFY_INTEGRATION_TESTS_API_URL` when set, else the client default — same override
Python supports, so the suite can be pointed at a staging API.

### 6.2 `_global_setup.ts` — the session-scoped cross-user resources

Python has two `scope='session'` fixtures — `test_dataset_of_another_user` and `test_kvs_of_another_user` —
that create a dataset and a KVS under the *second* user, sign them, and tear them down at the end of the
session. Vitest runs each file in its own worker, so a per-file `beforeAll` would create duplicates.

The right mechanism is vitest's `globalSetup` + `provide` / `inject` (available in the pinned vitest 4.1):

```ts
// _global_setup.ts
export default async function setup({ provide }: GlobalSetupContext) {
    const client2 = makeClient2();
    const dataset = await client2.datasets().getOrCreate(`API-test-permissions-${randomId()}`);
    await client2.dataset(dataset.id).pushItems(EXPECTED_ITEMS);
    provide('crossUserDataset', {
        id: dataset.id,
        signature: await createStorageContentSignatureAsync({
            resourceId: dataset.id,
            urlSigningSecretKey: dataset.urlSigningSecretKey!,
        }),
        expectedContent: EXPECTED_ITEMS,
    });
    // ... same for the KVS, including per-key HMAC signatures
    return async () => { /* delete both */ };
}
```

`@apify/utilities` already exports `createStorageContentSignatureAsync` and `createHmacSignatureAsync` (the
client uses them in `dataset.ts` and `key_value_store.ts`), so these are the exact analogues of Python's
`_utils/crypto.py` helpers — no new crypto code needed.

Tests read them with `inject('crossUserDataset')`. Needs a `declare module 'vitest' { interface
ProvidedContext { ... } }` block for type safety.

### 6.3 `_utils.ts` — helpers ported from `tests/_utils.py`

| Python | JS | Why it exists |
|---|---|---|
| `get_random_resource_name(label)` | `getRandomResourceName(label)` | Unique names under the API's 63-char limit. Prefix `js-client-test-` instead of `python-client-test-`. |
| `poll_until_condition(fn, cond, {timeout, poll_interval, backoff_factor})` | `pollUntilCondition(...)` | Waits on eventually-consistent state instead of a fixed sleep. `backoffFactor` covers highly variable waits like container startup. |
| `collect_iterate_until_present(factory, expectedIds, {max_attempts, interval})` | `collectUntilPresent(...)` | A freshly created resource may not appear in a listing immediately. Retries on *attempt count*, not a wall-clock deadline, so drains under load still get their retries. |
| `get_crypto_random_object_id(len)` | `randomId(len)` | — |
| `maybe_await`, `maybe_sleep` | not needed | No sync client in JS. |
| `parametrized_api_urls` | not needed | Unit-tier concern. |

Resource cleanup uses `try { ... } finally { await ...delete(); }` in each test, exactly as Python does —
not a fixture. It keeps the created/deleted pair visible in one place and survives assertion failures.

## 7. CI wiring

New job in `.github/workflows/check.yaml`, gated identically to Python's. Two changes to the workflow
header are needed: add `workflow_dispatch` to `on:` (currently absent), and keep the job inline rather than
a reusable workflow so fork PRs don't trip compile-time secret validation — JS's `check.yaml` is already
inline, so that part is free.

```yaml
integration_tests:
    name: Integration tests (Node ${{ matrix.node-version }})
    if: >-
      ${{
        (github.event_name == 'pull_request' && github.event.pull_request.head.repo.owner.login == 'apify') ||
        (github.event_name == 'push' && github.ref == 'refs/heads/master') ||
        github.event_name == 'workflow_dispatch'
      }}
    runs-on: ubuntu-latest
    strategy:
        fail-fast: false
        matrix:
            node-version: [22, 26]   # oldest supported + newest, mirroring Python's 3.11 + 3.14
    steps:
        - uses: actions/checkout@v7
        - uses: actions/setup-node@v7
          with:
              node-version: ${{ matrix.node-version }}
        - uses: apify/actions/pnpm-install@v1.4.0
        - run: pnpm test:integration
          env:
              APIFY_TEST_USER_API_TOKEN: ${{ secrets.APIFY_TEST_USER_JS_CLIENT_API_TOKEN }}
              APIFY_TEST_USER_2_API_TOKEN: ${{ secrets.APIFY_TEST_USER_2_API_TOKEN }}
```

No Chrome install step — integration tests are Node-only.

Coverage upload (`flags: integration`, mirroring Python) depends on the coverage config from phase 1; it can
be appended later without touching this job's structure.

## 8. Test mapping, Python → JS

193 Python functions → ~205 JS cases. Two systematic adaptations:

- **`iterate()` → async-iterable `list()`.** Python exposes `list()` and `iterate()` as separate methods and
  tests both. JS's `list()` *is* both a Promise and an `AsyncIterable`, so each Python `*_iterate` test
  becomes a `for await (const item of client.X().list(...))` case on the same endpoint. Same coverage, and
  it additionally pins the dual-nature contract that only `pagination.test.ts` touches today.
- **Model-validation tests stay, meaning shifts.** Python's `test_actor_get_parses_tiered_*`,
  `test_build_get_accepts_small_min_memory_mbytes`, `test_actor_builds_list_accepts_ci_origin`,
  `test_actor_definition_version_accepts_semver_triplet` guard Pydantic alias/validation drift from OpenAPI
  codegen. v3 has no generated models yet, but `feat/openapi-generated-models` and
  `feat/replace-ow-with-zod` are both in flight — so these port as field-fidelity assertions now and become
  load-bearing the moment either lands. Worth having early for exactly that reason.

| File | Py | JS | Notes |
|---|---|---|---|
| `apify_client.test.ts` | 1 | 1 | Auth smoke: `user().get()` returns the test user. |
| `actor.test.ts` | 20 | 21 | + `call({ log })` end-to-end through `LoggerActorRedirect`. |
| `actor_version.test.ts` | 6 | 6 | Direct. |
| `actor_env_var.test.ts` | 7 | 7 | Direct, incl. secret env var. |
| `build.test.ts` | 13 | 13 | Uses `client.builds()` for the user-wide listing; `getOpenApiDefinition()`. |
| `dataset.test.ts` | 24 | 28 | + `downloadItems()` per format (csv, json, jsonl, xlsx, html, rss, xml) — JS-specific method where Python has `get_items_as_bytes`. + `pushItems()` above the compression threshold round-trips (Node-only brotli path). |
| `key_value_store.test.ts` | 28 | 31 | + `getRecord(key, { buffer: true })` and `{ stream: true }` option shapes. + `recordExists()`. |
| `request_queue.test.ts` | 22 | 23 | + `paginateRequests()` — JS-only method. |
| `run.test.ts` | 18 | 19 | + `getStreamedLog()` against a real run (mock covers chunk splitting; live covers the actual stream). |
| `log.test.ts` | 4 | 4 | Direct. |
| `task.test.ts` | 15 | 15 | Direct, incl. `getInput`/`updateInput`. |
| `schedule.test.ts` | 8 | 8 | Direct, incl. `getLog()`. |
| `webhook.test.ts` | 10 | 10 | Direct, incl. `test()` and `dispatches()`. |
| `webhook_dispatch.test.ts` | 4 | 4 | Direct. |
| `store.test.ts` | 9 | 9 | Direct. |
| `user.test.ts` | 4 | 4 | `get`, `limits`, `monthlyUsage`, `updateLimits`. |
| **Total** | **193** | **~205** | |

### What the Actor-dependent tests run against

Worth calling out because it sets the cost: Python never builds a custom Actor. Run-related tests call the
public **`apify/hello-world`**; CRUD tests create throwaway Actors with inline `sourceFiles` and never build
them; pricing tests read the public `apify/facebook-pages-scraper`. The JS port does the same — no Actor
fixtures to maintain, no build waits except where the test is explicitly about builds.

## 9. Sub-phases

Each is independently mergeable and leaves CI green.

| | Scope | Files | Cases (est. → actual) | Notes |
|---|---|---|---|---|
| **6a** ✅ | Scaffolding | config, `_fixtures`, `_utils`, `_global_setup`, CI job, `apify_client.test.ts` | 1 → 1 | Proves the token wiring and the gating end-to-end before any bulk work. Merge this first even if the rest slips. |
| **6b** ✅ | Storage | `dataset`, `key_value_store`, `request_queue` | ~82 → 81 | Highest value: the endpoints the platform leans on hardest, and where signatures, compression, streaming and pagination all live. Exercises the cross-user fixtures, so it validates `_global_setup`. |
| **6c** ✅ | Actor & run | `actor`, `run`, `build`, `actor_version`, `actor_env_var`, `log` | ~70 → 70 | Slowest by far — every case here starts a real run or build. Dominates wall-clock. |
| **6d** ✅ | Remainder | `task`, `schedule`, `webhook`, `webhook_dispatch`, `store`, `user` | ~50 → 53 | Mostly fast CRUD. |

Suggested order: 6a → 6b → 6d → 6c. 6d before 6c because it is cheap and broadens endpoint coverage fast,
while 6c is where the runtime and flakiness risk concentrates — better tackled once the helpers have been
exercised by ~130 cases.

## 10. Flakiness policy

Python carries **no** rerun plugin. Flakiness is addressed at the source, and the JS port should keep that
discipline — a retry wrapper would hide exactly the real API regressions this tier exists to catch.

Three mechanisms, all ported:

1. **`pollUntilCondition`** instead of fixed sleeps, for eventually-consistent reads (a created resource
   appearing in a listing, a run leaving `READY`). `backoffFactor: 2` for container startup, where the wait
   ranges from a second to a minute.
2. **`collectUntilPresent`** for listing assertions, retrying on attempt count rather than a deadline.
3. **Tolerant status assertions.** Python asserts run status against a *set* — e.g. `start()` accepts
   `READY | RUNNING | SUCCEEDED | TIMED-OUT | TIMING-OUT | FAILED | ABORTING | ABORTED`, because under load
   the platform legitimately lands anywhere in there. Narrow assertions only where the test controls the
   outcome (after `waitForFinish()`, `call()` → `SUCCEEDED`).

Plus: every created resource in `try/finally`, and `waitForFinish()` before deleting a run that may still be
executing (Python does this in `test_run_abort` and `test_run_resurrect` — deleting a running run fails).

## 11. Risks

- **Wall clock.** ~35 `hello-world` runs at 10–30s each, plus builds. Estimate 10–20 min with 8-way file
  parallelism, concentrated in 6c. Mitigation: it runs only on org PRs and master, never on forks, and never
  blocks the fast unit job.
- **Compute cost** on the test account — real CUs per push to master.
- **Shared-account races** if the second token is an account someone else also uses; `my=true` listing
  assertions are the sensitive ones. Argues for dedicated users (§3).
- **Resource leakage** when a worker is killed mid-test (timeout, cancelled run). `try/finally` covers
  assertion failures but not SIGKILL. Python has no sweeper; optionally add a scheduled workflow that deletes
  `js-client-test-*` resources older than a day. Recommend deferring until leakage is actually observed.
- **`hello-world` changing.** Two Python tests already carry comments warning that the pricing fixtures
  break if the reference Actor's pricing changes. Same exposure here; the assertions carry the same
  explanatory failure messages so the fix is obvious.

## 12. Open questions

1. **Secret names** — reuse `APIFY_TEST_USER_2_API_TOKEN` if it is org-scoped, or provision a JS-specific
   pair? Needs someone who can see the org secrets.
2. **Node matrix** — 22 + 26 (mirroring Python's oldest + newest), or single-version to halve the cost and
   the API load? Integration tests rarely catch Node-version-specific bugs; a single version on 22 is
   defensible.
3. **Should 6a land on `v3` or `master`?** The tier is independent of the v3 changes, and having it on
   `master` too would protect the 2.x line. Cheaper to land on `v3` only and let it arrive with v3.
