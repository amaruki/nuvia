# Release Engineering

## Versioning

Semantic Versioning.
`0.x` until M4 (`TODO.md`) is complete — breaking changes are expected and
not called out specially during `0.x`.
`1.0.0` is the first release this document's guarantees actually apply to.

## Changelog

Keep a Changelog format, in `CHANGELOG.md`.
Every user-visible change — not every commit — gets an entry, written for
someone deciding whether to upgrade, not for someone who already read the
diff.

## Migration compatibility (expand/contract)

**Not yet a real constraint** — there is no production data, and
`db:reset` remains a normal development workflow (`docs/adr/0011-prisma-to-drizzle.md`).
This section describes the discipline that starts applying the moment that
stops being true, and names that transition explicitly rather than
crossing it silently:

- **Expand**: add a nullable column, a new table, or a new index — always
  safe, always backward-compatible with the previous application version.
- **Migrate data**: backfill the new column from the old one, still with
  both present.
- **Contract**: drop the old column, only after the application version
  that depended on it is no longer deployed anywhere.

A migration that combines expand and contract in one step (renaming a
column, dropping a column an old app version still reads) is unsafe the
moment more than one application version might be running against the
same database — which is every rolling deploy, not just a hypothetical.
`drizzle-kit check` (already wired into `bun run guard:heavy`) catches
migration-history inconsistency; it does not yet catch a destructive
migration lacking an explicit override marker — that CI check is `TODO.md`
M2 work.

## Artifact signing

Not yet implemented.
Target: SLSA Build Level 2 (hosted GitHub Actions runner, signed
provenance) via `actions/attest-build-provenance` and `cosign` keyless
signing (OIDC, no long-lived signing key to leak).
Level 3 (fully isolated, non-falsifiable build) is a stretch goal, not a
1.0 requirement.

## Promotion

Environments: local → staging → production.
Not yet formalized as a pipeline — this document states the intended shape
so the eventual CI/CD work has a target, not because the pipeline exists
today.
A build artifact is built once and promoted unchanged between
environments; it is never rebuilt per environment, which would break the
signed-provenance guarantee above (the thing that got signed and the thing
that got deployed must be the same bytes).

## Rollback

Rolling back the application to a previous version is a redeploy of the
previous signed artifact — no special procedure once artifact signing
exists.
Rolling back **across a migration that has already run** is the harder
case and needs the expand/contract discipline above to even be possible:
if the previous app version still works against the _current_ schema
(true for an expand-only migration, false for a contract), rollback is
safe.
If the migration already contracted (dropped a column the old version
needs), rollback requires restoring from a backup or re-adding the column
— there is no automatic "undo migration" that's safe in general, and
pretending otherwise is how rollbacks turn into data loss during an
incident.
