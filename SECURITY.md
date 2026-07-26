# Security Policy

## Supported versions

Pre-1.0 (`0.x`): only the latest commit on `main` is supported.
There is no long-term-support branch yet — see
[`docs/release.md`](docs/release.md) for when that changes.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Use
[GitHub's private vulnerability reporting](https://github.com/amaruki/nuvia/security/advisories/new)
for this repository.
This creates a private advisory visible only to maintainers until a fix is
ready, which avoids publishing exploit details before a patch exists.

Include, where you can:

- The affected file(s)/route(s) and, ideally, a minimal reproduction.
- The impact you believe it has (what an attacker could do with it).
- Whether it's already publicly known or exploited.

## What to expect

This is a young, actively-hardening project without a dedicated security
team or a formal SLA yet.
A best-effort acknowledgment within a few days is the realistic
expectation, not a guarantee — that gap itself is tracked honestly in
[`docs/supply-chain.md`](docs/supply-chain.md)'s triage section rather than
papered over with an SLA this project can't yet back up.

## Known, tracked issues

This project is transparent about its own security gaps rather than
hiding them behind a policy document that implies everything's fine.
See [`TODO.md`](TODO.md) M1 for the current list — as of this writing that
includes an account-deletion endpoint that doesn't delete anything, missing
rate limiting on the login endpoint, and incomplete role-level
authorization on dashboard routes.
These are known and being worked, not undiscovered.

## Scope

In scope: this repository's code, its Drizzle schema, and its default
configuration.
Out of scope: vulnerabilities in a dependency that don't have a
demonstrated, reachable impact on this application specifically (report
those upstream) — see
[`docs/supply-chain.md`](docs/supply-chain.md)'s reachability-based triage
policy for why.
