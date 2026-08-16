# Supply Chain

See [ADR-0012](adr/0012-bun-package-manager-and-runtime.md) for the reasons Nuvia uses Bun. See [ADR-0013](adr/0013-oxlint-oxfmt-toolchain.md) for the toolchain verification approach that this document follows.

## Lockfile and pinning

`bun.lock` is the only lockfile. This project does not use `package-lock.json` or `yarn.lock`. Every dependency in `package.json` has an exact version pin, not a `^` or `~` range. An exact pin means that a `bun install` on any machine, on any day, installs the identical dependency tree. A floating range means "whatever the latest matching version happens to be today." A floating range is a different, larger attack surface, because a compromised patch release then ships automatically.

## Adoption cooldown

This project does not adopt a new dependency version on the day of its publication. A minimum-release-age window (14 days proposed, not yet enforced by tooling) lets the community surface a compromised release before this project depends on it. This window defends specifically against a supply-chain attack pattern. An attacker compromises a maintainer's account and publishes a malicious patch. The registry or the maintainer then removes the malicious patch within hours of detection. Renovate (not yet configured) is the intended automation. Renovate would group updates by ecosystem, and would respect the cooldown.

## Vulnerability scanning

`bun audit` is the working scanner. `npm audit` cannot run against this repository at all (`ENOLOCK`, because no `package-lock.json` exists). This failure is itself part of why Bun's own audit command matters here, not just as a preference.

## Triage: severity × reachability, not severity alone

On 2026-07-26, `bun audit` reported 35 advisories (20 high, 12 moderate, 3 low). `bun audit --prod` reported 19 of those (15 high, 4 moderate). As of this date, neither run reported a critical advisory.

`--prod` filters more loosely than "excludes devDependencies" would suggest. It still surfaced advisories whose only dependency chain runs through packages that this repository declares as devDependencies. These packages are `shadcn`, `drizzle-kit`, `@commitlint/*`, and the bundled dev preview server of `react-email`. Two explanations are possible. Something elsewhere in the resolved tree also pulls in these packages. Alternatively, Bun's `--prod` filter operates on the flattened install, rather than strictly on the `dependencies` versus `devDependencies` split in `package.json`. `--prod`'s output does not mean these packages are definitely production-reachable. It is a coarser pre-filter. The reachability review below is where the real triage happens.

The team reviewed each advisory below for actual reachability. High severity alone does not mean an advisory is exploitable in this application:

- **`socket.io`/`socket.io-parser`/`ws`/`engine.io`/`minimatch`/`esbuild`** (high, high, high/moderate, high, high, moderate): all of these are transitive dependencies, reachable only through `react-email` (its bundled preview server and its own build tooling) and `shadcn` (the CLI, `ts-morph`). Neither `react-email` nor `shadcn` runs in the deployed application. The application sends email through `nodemailer`/`resend` (`src/lib/auth/index.ts`'s `EmailServiceType` picker), never through `react-email`'s development server. `shadcn` is a one-time component generator that a developer invokes manually, not a runtime dependency. **Not reachable as deployed.**
- **`postcss`** (moderate + 2 high: XSS via unescaped `<style>` output, arbitrary-file-read/path-traversal via `sourceMappingURL`): this is a transitive dependency via `@tailwindcss/postcss`, `next`, and `shadcn`, all of which process CSS only at build time. No user input reaches PostCSS at runtime. PostCSS never runs after `next build` produces static CSS output. **Not reachable as deployed.**
- **`ajv`** (moderate, ReDoS via the `$data` option) and **`fast-uri`** (4× high, host-confusion/path-traversal in URI parsing): these reached the application through `@hookform/resolvers` (a real runtime dependency for form validation), and also through `shadcn`, `react-email`, and `commitlint` (dev-only). **Resolved (issue #4)**: `package.json`'s `overrides` now floor `ajv` at `>=8.20.0` and `fast-uri` at `>=3.1.5`, versions in which both advisory sets are fixed. The form schemas only use the zod resolver path, so the floors carry no behavior risk; they retire the advisories outright rather than waiving them.
- **`defu`** (high, prototype pollution via `__proto__` in the defaults argument): this reached the application through `better-auth` (a real runtime dependency), and through `drizzle-orm`'s optional `@prisma/client` peer chain. **Resolved (issue #4)**: the `overrides` floor `defu` at `>=6.1.7` (fixed upstream), which the natural resolution already satisfies; the floor guards against regressions if a transitive range ever re-resolves the vulnerable line.
- **`effect`** (high, `AsyncLocalStorage` context loss under concurrent RPC load): this is transitive only via the dead `@prisma/client` peer chains in `better-auth`/`drizzle-orm` plus `@hookform/resolvers`' optional `effect` peer (only the zod resolver is used). Nothing in `src/` imports or executes `effect`. **Resolved (issue #4)**: the `overrides` floor `effect` at `>=3.20.0`, retiring the advisory; the waiver entry in `SECURITY-WAIVERS.md` stays as a fallback.
- **`nanoid`** (high, infinite loop in custom generators at size zero): transitive via `postcss` in the `next`/`@tailwindcss/postcss`/`shadcn` build chains. **Resolved (issue #4)**: floored at `>=3.3.18` by `overrides`.
- **`sharp`** (high, inherited libvips CVEs): this is transitive via `next` (`next/image`'s built-in optimizer). This is currently low risk. This repository's `next.config.ts` only allows `images.remotePatterns` from `images.unsplash.com` and `upload.wikimedia.org` (no user-controlled image URLs). `src/lib/services/media-upload.service.ts` (the only file that handles user-uploaded images) never actually writes a file yet (`TODO.md` M3). **Revisit this before the team ships file/avatar uploads.** The actual risk this advisory describes is that `sharp` processes attacker-supplied image bytes, and that path does not exist yet.

This is the policy from now on, not just a one-time finding. The team triages a new advisory by severity **and** by whether the vulnerable code path is actually reachable from this application's configuration. A "critical" advisory in an unused code path is lower priority than a "moderate" advisory in a path that every request touches. A blanket "zero vulnerabilities" rule would fail immediately against the dev-tooling-only highs above, and the team would abandon that rule within a month. A policy that nobody follows is worse than an honest, lower bar that is actually enforced.

## What blocks CI vs. what opens an issue

- **Blocks CI**: critical or high severity, in a **production** dependency (`bun audit --prod`), with no active waiver in `SECURITY-WAIVERS.md`. **This is now wired.** The `audit:gate` script (`scripts/audit-gate.ts`, run by `bun run audit:gate` and by the `heavy` job in `.github/workflows/ci.yml`) parses `bun audit --prod --json`, fails on any unwaived high/critical advisory, and ignores expired waiver entries. The previous advisory-only step (`bun audit --prod` with `continue-on-error: true`) is gone.
- **Opens an issue, does not block**: this happens in three cases.
  - Critical or high severity in a dev-only dependency.
  - Moderate or low severity anywhere.
  - Anything already covered by an active, non-expired waiver.
- **Waiver mechanism**: [`SECURITY-WAIVERS.md`](../SECURITY-WAIVERS.md) at the repository root holds a dated entry per advisory. Each entry references the advisory ID, the reachability analysis that justified the waiver, and an expiry date. An unreviewed waiver that never expires is how a "temporary" exception becomes permanent.

## SBOM and provenance

Nuvia does not generate a Software Bill of Materials (SBOM) yet. The project will produce an SBOM in CycloneDX format at build time (`TODO.md` M4). SLSA build provenance (cosign keyless signing through GitHub Actions OIDC) is the release-time counterpart. See `docs/release.md`.

## postinstall scripts

Nuvia does not audit or restrict postinstall scripts yet. The project should document a policy before `1.0`: an allow-list for known-safe packages' postinstall scripts, and a block for unknown packages' scripts. This policy is tracked, not yet decided.
