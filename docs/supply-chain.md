# Supply Chain

See [ADR-0012](adr/0012-bun-package-manager-and-runtime.md) for why Bun,
and [ADR-0013](adr/0013-oxlint-oxfmt-toolchain.md) for the toolchain
verification approach this document's tone follows.

## Lockfile and pinning

`bun.lock` is the only lockfile — no `package-lock.json`, no `yarn.lock`.
Every dependency in `package.json` is pinned to an exact version, no `^`
or `~`.
An exact pin means a `bun install` on any machine, any day, installs the
identical dependency tree — a floating range means "whatever the latest
matching version happens to be today," which is a different, larger attack
surface (a compromised patch release ships automatically).

## Adoption cooldown

New dependency versions are not adopted the day they're published.
A minimum-release-age window (14 days proposed, not yet enforced by
tooling) lets the community surface a compromised release before this
project depends on it — this defends specifically against the
supply-chain attack pattern where a maintainer's account is compromised
and a malicious patch is published, then pulled within hours once
detected.
Renovate (not yet configured) is the intended automation, grouped by
ecosystem, respecting the cooldown.

## Vulnerability scanning

`bun audit` — the working scanner.
`npm audit` cannot run against this repo at all (`ENOLOCK`, since there is
no `package-lock.json`), which is itself part of why Bun's own audit
command matters here, not just as a preference.

## Triage: severity × reachability, not severity alone

On 2026-07-26, `bun audit` reported 116 advisories: 3 critical, 63 high, 38
moderate, 12 low.
All three "critical" advisories were checked for actual reachability in
this codebase, not assumed exploitable from the severity label alone.
Two were better-auth issues requiring `session.cookieCache` (not enabled
anywhere in `src/`) or the `oidc-provider`/`mcp` plugins (only
`nextCookies()` is loaded).
The third was `fast-xml-parser`, transitive via dev-only tooling.
**None were reachable as configured.**

This is the policy going forward, not just a one-time finding: a new
advisory is triaged by severity **and** whether the vulnerable code path is
actually reachable from this application's configuration.
A "critical" advisory in an unused code path is lower priority than a
"moderate" one in a path every request touches.
A blanket "zero vulnerabilities" rule would fail immediately against the
63 highs in dev tooling alone and would be abandoned within a month — a
policy nobody follows is worse than an honest, lower bar that's actually
enforced.

## What blocks CI vs. what opens an issue

- **Blocks CI**: critical or high severity, in a **production** dependency
  (`bun audit --prod`), with no documented waiver.
- **Opens an issue, doesn't block**: critical or high in a dev-only
  dependency; moderate or low anywhere; anything already covered by an
  active, non-expired waiver.
- **Waiver mechanism** (not yet built): a dated entry in a
  `SECURITY-WAIVERS.md` file, referencing the advisory ID, the reachability
  analysis that justified it, and an expiry date — an unreviewed waiver
  that never expires is how a "temporary" exception becomes permanent.

## SBOM and provenance

Not yet generated.
CycloneDX format, produced at build time (`TODO.md` M4).
SLSA build provenance (cosign keyless signing via GitHub Actions OIDC) is
the release-time counterpart — see `docs/release.md`.

## postinstall scripts

Not currently audited or restricted.
Worth a documented policy (allow-list known-safe packages' postinstall
scripts, block unknown ones) before 1.0 — tracked, not yet decided.
