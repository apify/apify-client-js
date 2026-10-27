# OpenAPI request validator

Checks the requests the client sends against the Apify API OpenAPI specification and reports every mismatch.
Only requests are validated; responses are passed through untouched. Nothing is ever blocked, the result is a
report, so it works as a warning in CI while the specification and the client catch up with each other.

- `validator.mts` is an Express middleware. The unit-test mock server mounts it when `OPENAPI_SPEC_PATH` is set
  and appends findings to `OPENAPI_REPORT_FILE`.
- `proxy.mts` is a validating reverse proxy for the integration tests. It forwards every request to the live API
  and records the findings on the way. `GET /__openapi-report` returns them as JSON.
- `report.mts` aggregates a findings file by operation and error and prints one warning line per group, as
  GitHub Actions warning annotations in CI. `--fail` makes it exit non-zero when there is any finding.

```sh
pnpm spec:fetch
# Unit tests
OPENAPI_SPEC_PATH=tmp/openapi.json OPENAPI_REPORT_FILE=openapi-findings.jsonl pnpm test
# Integration tests
pnpm openapi:proxy --spec tmp/openapi.json --port 3999 --report openapi-findings.jsonl &
APIFY_INTEGRATION_TESTS_API_URL=http://127.0.0.1:3999 pnpm test:integration
pnpm openapi:report openapi-findings.jsonl
```

Known false positives of the underlying `express-openapi-validator` are filtered, the same way the API server's
own monitoring does it: `0` and `1` for boolean query parameters, internal query parameters, the undocumented
legacy `/v2/acts` alias, and `+` encoding a space in a query value.
