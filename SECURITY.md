# Security Policy

## Supported versions

Pre-1.0 (`0.x`): only the latest commit on `main` is supported. There is no long-term-support branch yet. See [`docs/release.md`](docs/release.md) for when that changes.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Use [GitHub's private vulnerability reporting](https://github.com/amaruki/nuvia/security/advisories/new) for this repository. This creates a private advisory that only maintainers can see until a fix is ready. This keeps exploit details private before a patch exists.

Include, where you can:

- The affected file(s)/route(s) and, ideally, a minimal reproduction
- The impact you believe it has (what an attacker could do with it)
- Whether it is already publicly known or exploited

## What to expect

This is a young, actively-hardening project without a dedicated security team or a formal SLA yet. A best-effort acknowledgment within a few days is the realistic expectation. It is not a guarantee. This project tracks that gap honestly in [`docs/supply-chain.md`](docs/supply-chain.md)'s triage section, instead of hiding it behind an SLA it cannot yet support.

## Known, tracked issues

This project is transparent about its own security gaps. It does not hide them behind a policy document that implies everything is fine. As of this writing, the open list includes:

- Incomplete role-level authorization on dashboard routes

(The account-deletion endpoint now hard-deletes through better-auth's `deleteUser`, and the login endpoint is rate-limited — both were on this list and have been fixed.)

The maintainers know about these issues. These are not undiscovered gaps. The maintainers work to fix them.

## Deployments seeded before the migration must rotate credentials

Between commits `1c51550` and `c688925`, `prisma/seed.ts` shipped a hard-coded superadmin password (`Admin123!@#`) for five privileged accounts. The string remains retrievable from this repository's git history and is now publicly known (CWE-798). **Any deployment that was seeded from that era must rotate the superadmin password (and the other seeded account passwords) immediately.** A history rewrite was deliberately not performed; see issue #5 for the trade-off analysis.

Going forward, two controls prevent a recurrence:

- CI runs a gitleaks scan over the **full git history** on every push and pull request (job `secret-scan` in `.github/workflows/ci.yml`). The gate includes a runtime-generated fixture secret and asserts the scan fires on it, so an over-broad allowlist cannot silently disarm the gate.
- `lefthook` runs the same scan locally on pre-push for contributors who have the gitleaks binary installed (`bun run scan:secrets`).

## Scope

In scope: this repository's code, its Drizzle schema, and its default configuration. Out of scope: vulnerabilities in a dependency that do not have a demonstrated, reachable impact on this application specifically. Report those upstream instead. See [`docs/supply-chain.md`](docs/supply-chain.md)'s reachability-based triage policy for why this is out of scope.
