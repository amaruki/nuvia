# Architecture Decision Records

This directory contains one ADR file for each decision. Each of these decisions has, or had, more than one competing answer in this codebase. Format: Context / Decision / Consequences. A new ADR is warranted when a reviewer could reasonably ask "why not the other way?" and the answer is not obvious from the code alone.

| #                                               | Decision                                               | Status                                     |
| ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| [0001](0001-one-authorization-helper.md)        | `requirePermission` is the only authorization helper   | Accepted                                   |
| [0002](0002-rfc9457-error-contract.md)          | RFC 9457 Problem Details is the only API error shape   | Accepted, not yet implemented              |
| [0003](0003-single-rate-limiter.md)             | One Redis-backed rate limiter                          | Accepted, not yet implemented              |
| [0004](0004-one-structured-logger.md)           | One structured logger, `no-console` enforced           | Accepted, not yet implemented              |
| [0005](0005-permissions-not-roles.md)           | Nav derives from permissions, not a parallel role list | Accepted, not yet implemented              |
| [0006](0006-server-first-components.md)         | Server Components by default                           | Accepted, not yet implemented              |
| [0007](0007-single-association-tenant-seam.md)  | Single-association deployment + `orgId` seam           | Accepted, `Organization` table implemented |
| [0008](0008-module-maturity-gate.md)            | Module maturity tiers gate the default-on flag         | Accepted, not yet implemented              |
| [0009](0009-security-hardening-p0.md)           | P0 security fixes: what shipped now vs. deferred       | Partially implemented                      |
| [0010](0010-ai-agent-commit-guard.md)           | Local git hooks gate every commit, human or AI         | Accepted, implemented                      |
| [0011](0011-prisma-to-drizzle.md)               | Prisma → Drizzle ORM migration                         | Implemented                                |
| [0012](0012-bun-package-manager-and-runtime.md) | Bun is the canonical package manager and runtime       | Accepted, implemented                      |
| [0013](0013-oxlint-oxfmt-toolchain.md)          | oxlint + oxfmt replace ESLint + Prettier               | Accepted, implemented                      |
