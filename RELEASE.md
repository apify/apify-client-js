# How apify-client releases work

Releases are managed by GitHub Actions and `apify/actions/git-cliff-release`. There are two
release lines:

| line | branch | stable dist-tag | canary dist-tag |
|---|---|---|---|
| v3 (current development) | `master` | `latest` (from 3.0.0 on) | `next-v3` now, `next` once 3.0.0 is stable |
| v2 (maintenance) | `2.x` | `latest` until 3.0.0 ships, then `latest-v2` | `next-v2` |

Release candidates for the next major are published from `master` under the `rc` dist-tag.
Canary versions always keep the `-beta.N` suffix regardless of the dist-tag they ship under.

## Canary releases

Every push to `master` or `2.x` (not starting with `docs`/`ci` and not `[skip ci]`) triggers
`pre_release.yaml`, which dispatches `publish_to_npm.yaml` with the branch's canary dist-tag.
`before-beta-release.js` derives the version from `package.json` plus the published versions
on the registry (on master, the dist-tag name selects the premajor base: `next-v3` → `3.0.0-beta.N`).
Master canaries are commitless while 3.0.0 is unreleased; the `2.x` flow commits the
changelog and version bump, as master used to.

## Stable releases

Trigger `release.yaml` manually via `workflow_dispatch` **from the branch you want to release**:

- `master` + `release_type: auto` (or `custom` `3.0.0`) is how `3.0.0` goes out — git-cliff
  derives the version from conventional commits, commits the changelog, creates the GitHub
  release, and publishes with `tag: latest`.
- `2.x` ships v2 maintenance releases (keeps `latest` until 3.0.0, then `latest-v2`).

On releases from `master`, the `version-docs` job snapshots the current docs into
`website/versioned_docs` under the release's major version, keeping snapshots of older
majors. The job never runs for maintenance branches — it checks out the default branch.

## RC releases

Dispatch `publish_to_npm.yaml` from `master` with `tag: rc`. This publishes `3.0.0-rc.N`
under the `rc` dist-tag and pushes a `v3.0.0-rc.N` git tag; no commit lands on the branch.

## 3.0.0 release day

See the tracking issue for the ordered checklist (publish 3.0.0 to `latest`, switch master
canaries `next-v3` → `next` and restore the changelog-committing flow, switch 2.x stable
releases to `latest-v2`, clean up retired dist-tags).

## Playbook: switching master to the next major

Adapted from the crawlee v4 transition (see crawlee's RELEASE.md for the original); the
publishing differs — no lerna, a single package, git-cliff versioning — but the flow is the
same:

1. **Cut the maintenance branch first.** Branch `(N-1).x` off the master tip. In one commit:
   point `check.yaml` and `pre_release.yaml` triggers at the branch, set the canary dist-tag
   to `next-v(N-1)`, and delete the `version-docs` job from `release.yaml` (it checks out
   the repo default branch, so it would snapshot the wrong docs). Stable releases keep
   `latest` until the new major ships.
2. **Rebase the `vN` branch onto the master tip** and validate: build, type-check, tests,
   website build, API surface report. Watch for master-side fixes silently lost in the
   rebase — rerere resolutions from an earlier merge can revert them without a visible
   conflict; verify test titles from master-only fixes still exist.
3. **Prep the `vN` branch for becoming master** (before the push): move the commitless
   `next-vN` canary flow into `pre_release.yaml` (delete the extra pre-release workflow),
   narrow `check.yaml` triggers back to `master`, and keep the changelog-committing canary
   flow parked until the stable release.
4. **Fast-forward push master.** A PR cannot do this (squash-only merges on the default
   branch). The org rulesets "Important branches PR enforcement" and "Allow only squash
   merges…" accept the `BypassTemporary` team — join it for the push. The repo "Required
   checks" ruleset is satisfied by the check runs already attached to the pushed SHA, so
   update its required contexts to the new branch's job names **before** pushing and make
   sure the `vN` tip is green.
5. **Retarget open `vN`-based PRs to master** (`gh pr edit --base master`) before deleting
   the `vN` branch — after a fast-forward push, deleting the branch would auto-close them.
6. **Update required status checks** for the new Node matrix, and check renovate: no
   `baseBranches` means the maintenance branch gets no dependency updates unless added.
7. **Open the release-day tracking issue** with the dist-tag flips — the maintenance branch
   must move off `latest` the same day the new major claims it.
