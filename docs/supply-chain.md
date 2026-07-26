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

On 2026-07-26, `bun audit` reported 35 advisories (20 high, 12 moderate, 3
low); `bun audit --prod` reported 19 of those (15 high, 4 moderate) — no
criticals in either run as of this date.

`--prod`'s filtering is looser than "excludes devDependencies": it still
surfaced advisories whose only dependency chain runs through packages this
repo declares as devDependencies (`shadcn`, `drizzle-kit`,
`@commitlint/*`, `react-email`'s bundled dev preview server) — apparently
because something elsewhere in the resolved tree also pulls them in, or
because Bun's `--prod` filter operates on the flattened install rather than
strictly on `package.json`'s `dependencies` vs `devDependencies` split.
Concretely: don't take `--prod`'s output as "these are definitely
production-reachable" — it's a coarser pre-filter, and the reachability
review below is where the real triage happens.

Reviewed for actual reachability, not assumed exploitable from severity
alone:

- **`socket.io`/`socket.io-parser`/`ws`/`engine.io`/`minimatch`/`esbuild`**
  (high, high, high/moderate, high, high, moderate) — all transitive only
  through `react-email` (its bundled preview server and its own build
  tooling) and `shadcn` (the CLI, `ts-morph`). Neither runs in the deployed
  app: emails are sent via `nodemailer`/`resend`
  (`src/lib/auth.ts`'s `EmailServiceType` picker), never through
  `react-email`'s dev server, and `shadcn` is a one-time component
  generator invoked manually, not a runtime dependency. **Not reachable as
  deployed.**
- **`postcss`** (moderate + 2 high: XSS via unescaped `<style>` output,
  arbitrary-file-read/path-traversal via `sourceMappingURL`) — transitive
  via `@tailwindcss/postcss`/`next`/`shadcn`, all build-time CSS
  processing. No user input reaches PostCSS at runtime; it never runs
  after `next build` produces static CSS output. **Not reachable as
  deployed.**
- **`ajv`** (moderate, ReDoS via the `$data` option) and **`fast-uri`**
  (4× high, host-confusion/path-traversal in URI parsing) — transitive via
  `@hookform/resolvers` (a real runtime dependency: form validation) as
  well as `shadcn`/`react-email`/`commitlint` (dev-only). **Not fully
  verified**: whether any zod schema validated through
  `@hookform/resolvers` uses ajv's `$data` option or a URI-format check on
  attacker-controlled input needs a closer read of the form schemas before
  this can be called non-reachable with confidence — flagged for follow-up
  rather than waived on an assumption.
- **`defu`** (high, prototype pollution via `__proto__` in the defaults
  argument) — transitive via `better-auth` (a real runtime dependency) and
  via `drizzle-orm`'s optional `@prisma/client` peer chain (Prisma itself
  is fully removed per ADR-0011, so that second path is dead weight, not a
  live call path). **Not fully verified** on the better-auth path: whether
  better-auth ever calls defu's merge with a combination of trusted
  defaults and attacker-controlled overrides needs tracing through
  better-auth's config-merging internals — flagged for follow-up.
- **`effect`** (high, `AsyncLocalStorage` context loss under concurrent
  RPC load) — transitive only via the same dead `@prisma/client` peer
  chains (`better-auth`'s and `drizzle-orm`'s). Prisma is fully removed
  from this codebase (ADR-0011); this dependency edge exists in the
  package graph but nothing in `src/` exercises it. **Not reachable as
  deployed.**
- **`sharp`** (high, inherited libvips CVEs) — transitive via `next`
  (`next/image`'s built-in optimizer). Currently low risk: this repo's
  `next.config.ts` only allows `images.remotePatterns` from
  `images.unsplash.com`/`upload.wikimedia.org` (no user-controlled image
  URLs), and `src/lib/services/media.service.ts` (the only file that would
  handle user-uploaded images) never actually writes a file yet (`TODO.md`
  M3). **Revisit before shipping file/avatar uploads** — sharp processing
  attacker-supplied image bytes is the actual risk this advisory
  describes, and that path doesn't exist yet.

This is the policy going forward, not just a one-time finding: a new
advisory is triaged by severity **and** whether the vulnerable code path is
actually reachable from this application's configuration.
A "critical" advisory in an unused code path is lower priority than a
"moderate" one in a path every request touches.
A blanket "zero vulnerabilities" rule would fail immediately against the
dev-tooling-only highs above and would be abandoned within a month — a
policy nobody follows is worse than an honest, lower bar that's actually
enforced.

## What blocks CI vs. what opens an issue

- **Blocks CI**: critical or high severity, in a **production** dependency
  (`bun audit --prod`), with no documented waiver. **Not yet actually wired
  this way** — `package.json`'s `guard:heavy` script runs
  `bun audit --prod` non-blocking (`|| true`) today, matching
  `.github/workflows/ci.yml`'s `continue-on-error: true` on the same step,
  because the waiver mechanism below didn't exist yet when severity ×
  reachability was still a manual review rather than something CI could
  check automatically. Once `SECURITY-WAIVERS.md` covers every currently-open
  high/critical in a production dependency, this can become a real gate
  (fail the build on an unwaived high/critical, pass on a waived one) —
  tracked, not yet built.
- **Opens an issue, doesn't block**: critical or high in a dev-only
  dependency; moderate or low anywhere; anything already covered by an
  active, non-expired waiver.
- **Waiver mechanism**: [`SECURITY-WAIVERS.md`](../SECURITY-WAIVERS.md) at
  the repo root — a dated entry per advisory, referencing the advisory ID,
  the reachability analysis that justified it, and an expiry date. An
  unreviewed waiver that never expires is how a "temporary" exception
  becomes permanent.

## SBOM and provenance

Not yet generated.
CycloneDX format, produced at build time (`TODO.md` M4).
SLSA build provenance (cosign keyless signing via GitHub Actions OIDC) is
the release-time counterpart — see `docs/release.md`.

## postinstall scripts

Not currently audited or restricted.
Worth a documented policy (allow-list known-safe packages' postinstall
scripts, block unknown ones) before 1.0 — tracked, not yet decided.
