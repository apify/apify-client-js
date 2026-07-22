# CLAUDE.md

Guidance for agents (and humans) working in this repository.

## `@since` JSDoc tags

Public symbols carry a `@since Added in X.Y.Z` TypeDoc tag, rendered on the generated reference
pages (`/reference`). Only annotate a symbol when it needs one:

- Every top-level exported symbol (client class, method, interface, type) gets a tag.
- A member (property, method) gets its own tag only if it was added *later* than its parent -
  a member introduced alongside its parent is already covered by the parent's tag and doesn't
  need a repeated one.

When adding a new public symbol (or a new member on an existing one), add
`@since Added in <version>` using the version this change will ship in. That version isn't known
until release time - use the next version implied by `CHANGELOG.md`'s unreleased section (bump
patch/minor/major depending on the nature of the change, matching how `git-cliff` would bump it).
If the release ends up bumping differently, fix the tag as part of that PR review; it doesn't need
a dedicated follow-up.

Do not add `@since` tags to pre-existing symbols retroactively unless you know their actual
introduction version - leave them untagged rather than guessing.

## Docs versioning

`website/` publishes two versions of the docs/reference: the default (root) build is the latest
released version ("stable"), and `/next` is built from the current `master` HEAD (i.e., whatever
hasn't been released yet). There is intentionally only ever one stable snapshot - the
`version-docs` job in `.github/workflows/release.yaml` wipes the previous one before snapshotting
the newly released version, so old version snapshots don't accumulate in the repo.
