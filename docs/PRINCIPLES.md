# Principles

Nuvia must be fast, easy to customize, developer-friendly, user-friendly, scalable, secure, transparent, and auditable. A list of virtues that never says no to anything is decoration, not a principle. Each principle below has an observable test. This document also resolves the two real conflicts between the principles explicitly. As a result, a future pull request does not need to resolve them again.

## The eight

**Fast.** Time-to-first-byte and time-to-interactive matter more than micro-benchmarks. _Test:_ Server Components are the default ([ADR-0006](adr/0006-server-first-components.md)). A pull request can move a page from a Server Component to a Client Component. Without a documented interactivity reason for the move, a reviewer asks why in review.

**Easy to customize.** An association that deploys Nuvia can change its branding, add a field, or adjust a workflow. None of this requires a fork of core logic. _Test:_ association identity and settings live in the `Organization` row ([ADR-0007](adr/0007-single-association-tenant-seam.md)), not in hardcoded strings. A module documents its public surface (schema, API, feature flag) well enough that a developer can extend the module. The developer does not need to read its internal code first.

**Developer-friendly.** A new contributor can find the canonical way to do something, and does not need to ask. _Test:_ every contested decision has an ADR (`docs/adr/`). `CODING_STANDARD.md` states the pattern once, not per file. `oxlint` and `dependency-cruiser` catch the wrong import before a human has to catch it.

**User-friendly.** Every module that actually ships meets WCAG 2.2 AA (`TODO.md` M4). No navigation link points to a broken page. If a feature is broken, the system disables it and does not render it silently wrong. See "Customizable vs. secure by default" below for the edge case.

**Scalable.** Nuvia scales with the size of an association (members, events, chapters), not with server count first. _Test:_ request handling stays stateless, and Redis (not in-process memory) holds anything shared across processes ([ADR-0003](adr/0003-single-rate-limiter.md)). The single-tenant-with-seam schema ([ADR-0007](adr/0007-single-association-tenant-seam.md)) means that a later move to multiple associations only adds code. This move does not require a rewrite.

**Secure.** _Test:_ the OWASP ASVS + NIST SSDF controls mapping (`docs/security/controls.md`) states, for each control, whether the control is CI-verified or process-only. The document marks an unverified claim as unverified, and does not assert that the control is done.

**Transparent.** Say what is true. Say it even when it is unflattering. _Test:_ this document is itself an example. `TODO.md` corrects an earlier, wrong claim about the auth gate. `TODO.md` does not quietly drop the claim. `docs/security/controls.md` states plainly that a repository cannot satisfy ISO 27001 Annex A A.5–A.7, and that certification needs an external auditor. The document does not list the framework and let the reader assume full coverage.

**Auditable.** Every privileged action leaves a trace. _Test:_ a role change and its audit-log write happen in one transaction ([ADR-0009](adr/0009-security-hardening-p0.md)), not as two statements that can diverge on failure. Structured logs carry a trace ID from the request to the database write to the error response (`docs/observability.md`).

## Where they conflict

Principles that never conflict do no work. Two pairs of principles here genuinely conflict. A rule resolves each pair. The resolution is not a matter of personal taste.

### Customizable vs. secure by default

**Rule: Secure by default wins. Customization only adds. Customization never weakens a security default silently.** A deployer can add fields, adjust workflows, and configure branding through the `Organization.settings` JSON column and documented extension points. A deployer cannot use ordinary configuration to disable authentication on `/dashboard/**`, turn off audit logging, or downgrade a cookie's `SameSite` policy. Those changes require a source code edit, which is a deliberate, reviewable, git-tracked act, not a settings toggle. The module maturity gate ([ADR-0008](adr/0008-module-maturity-gate.md)) sets every new module to _off_ by default, until the module is authorized and tested. "Easy to customize" cannot mean "easy to accidentally expose an unauthorized mock module to real users."

### Fast vs. auditable

**Rule: The request path stays fast. The audit trail is asynchronous, except where asynchronous logging would create a gap that an attacker could exploit. In that case, the audit trail is synchronous.** A page render does not block on a full audit-log flush to disk. A _privileged mutation_ writes its audit entry in the same transaction as the mutation itself, per [ADR-0009](adr/0009-security-hardening-p0.md). A privileged mutation is a role change, a permission grant, or, once M3 lands, a financial transaction. That transaction costs two or three extra milliseconds, and this cost is not optional. An audit entry that might not exist is not an audit trail. Read-path logging (page views, search queries) is fire-and-forget by design. Write-path logging of anything privileged is not fire-and-forget.
