# Release Engineering

## Versioning

Nuvia follows Semantic Versioning. The version stays at `0.x` until `TODO.md` M4 is complete. During `0.x`, developers should expect breaking changes, and the changelog does not call each one out specially. `1.0.0` is the first release that this document's guarantees actually apply to.

## Changelog

`CHANGELOG.md` follows the Keep a Changelog format. Every user-visible change gets an entry, not every commit. Write each entry for a reader who must decide whether to upgrade, not for a reader who already read the diff.

## Migration compatibility (expand/contract)

**This is not yet a real constraint.** No production data exists yet, and `db:reset` remains a normal development workflow (`docs/adr/0011-prisma-to-drizzle.md`). This section describes the discipline that starts to apply the moment that changes. This document names that transition explicitly. It does not cross that transition silently:

- **Expand**: add a nullable column, a new table, or a new index. This step is always safe, and always stays backward-compatible with the previous application version.
- **Migrate data**: backfill the new column from the old one. Keep both columns present during this step.
- **Contract**: drop the old column. Do this only after no deployment still runs the application version that depended on the old column.

A migration that combines expand and contract in one step becomes unsafe under a condition. The condition is that more than one application version might run against the same database at the same time. For example, a migration might rename a column, or drop a column that an old application version still reads. This condition holds during every rolling deploy, not just in a hypothetical case. `drizzle-kit check` (already wired into `bun run guard:heavy`) catches an inconsistency in the migration history. It does not yet catch a destructive migration that lacks an explicit override marker. That CI check is `TODO.md` M2 work.

## Artifact signing

Nuvia implements SLSA Build Level 2 at release time. `.github/workflows/release.yml` runs when a GitHub Release is published — the release mechanism this document's Promotion section assumes — and does the following:

- Builds the artifact once, with the same environment as CI's heavy job, and packages it as `nuvia-build-<tag>.tar.gz` (the `.next` build output, `public`, `package.json`, `bun.lock`, and the `drizzle/` migrations — the deployable unit).
- Generates a signed SLSA build-provenance attestation for the tarball with `actions/attest-build-provenance`, stored in GitHub's attestation store. Nothing is pushed to any registry.
- Signs the tarball keylessly with `cosign sign-blob` against Sigstore Public Good, using the GitHub Actions OIDC token. No long-lived signing key exists, so there is none to leak.
- Uploads the tarball, its `sha256` checksum, the cosign bundle (`*.sigstore.json`), and the attestation bundle as workflow-run artifacts.

Level 3 (a fully isolated, non-falsifiable build) remains a stretch goal, not a requirement for `1.0`.

### Verification

Download the release workflow run's artifacts (`gh run download`), then verify both trust chains:

Provenance, via the GitHub attestation CLI:

```sh
gh attestation verify nuvia-build-<tag>.tar.gz --repo amaruki/nuvia
```

Keyless signature, via cosign:

```sh
cosign verify-blob \
  --bundle nuvia-build-<tag>.tar.gz.sigstore.json \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github\.com/amaruki/nuvia/\.github/workflows/release\.yml@refs/tags/.*' \
  nuvia-build-<tag>.tar.gz
```

The attestation check proves the bytes were built by this repository's workflow; the cosign check pins the signer to exactly `release.yml` running at a release tag. Verification fails if the tarball differs by one byte from what that run built, or if it was signed by any other workflow, repository, or ref. An artifact that passes both checks is what the Promotion section's rule protects: the signed bytes and the deployed bytes are the same bytes.

## Promotion

The environments are local, staging, and production, in that order. This pipeline is not yet formalized. This document states the intended shape, so that the eventual CI/CD work has a target. The pipeline does not exist today. The team builds a build artifact once, and promotes it unchanged between environments. The team never rebuilds the artifact per environment. A rebuild would break the signed-provenance guarantee above: the signed bytes and the deployed bytes must be the same bytes.

## Rollback

A rollback of the application to a previous version is a redeploy of the previous signed artifact. This needs no special procedure, once artifact signing exists. A rollback **across a migration that has already run** is the harder case, and needs the expand/contract discipline above even to be possible. If the previous application version still works against the _current_ schema, rollback is safe. This condition is true for an expand-only migration, and false for a migration that already contracted. If the migration already contracted, for example if it dropped a column that the old version needs, rollback needs a different approach. The team must restore from a backup, or re-add the column. No automatic "undo migration" is safe in general. If engineers assume an "undo migration" is always safe, that assumption causes data loss during an incident.
