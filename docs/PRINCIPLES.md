# Principles

Eight things Nuvia is supposed to be: fast, easy to customize,
developer-friendly, user-friendly, scalable, secure, transparent, auditable.
A list of virtues that never says no to anything is decoration, not a
principle — so each one below carries an observable test, and the two real
conflicts between them are ruled on explicitly rather than left for every
future PR to relitigate.

## The eight

**Fast.** Time-to-first-byte and time-to-interactive matter more than
micro-benchmarks. _Test:_ Server Components by default
([ADR-0006](adr/0006-server-first-components.md)); a PR that moves a page
from Server to Client Component without a documented interactivity reason
gets asked why in review.

**Easy to customize.** A deploying association can change branding, add a
field, or adjust a workflow without forking core logic. _Test:_ association
identity and settings live in the `Organization` row
([ADR-0007](adr/0007-single-association-tenant-seam.md)), not hardcoded
strings; a module's public surface (schema, API, feature flag) is
documented well enough that extending it doesn't require reading its
internals first.

**Developer-friendly.** A new contributor can find the canonical way to do
something without asking. _Test:_ every contested decision has an ADR
(`docs/adr/`); `CODING_STANDARD.md` states the pattern once, not per file;
`oxlint`/`dependency-cruiser` catch the wrong import before a human has to.

**User-friendly.** WCAG 2.2 AA on every module actually shipped
(`TODO.md` M4); no dead nav links; a broken feature is disabled, not left to
render silently wrong (see "customize vs. secure by default" below for the
edge of this one).

**Scalable.** Scales with an association's size (members, events,
chapters), not with server count first. _Test:_ stateless request handling,
Redis (not in-process memory) for anything shared across processes
([ADR-0003](adr/0003-single-rate-limiter.md)); the single-tenant-with-seam
schema ([ADR-0007](adr/0007-single-association-tenant-seam.md)) means
scaling to multi-association later is additive, not a rewrite.

**Secure.** _Test:_ the OWASP ASVS + NIST SSDF controls mapping
(`docs/security/controls.md`) states, per control, whether it's
CI-verified or process-only — a claim with no test behind it is marked as
such, not asserted as done.

**Transparent.** Say what's true, including when it's unflattering. _Test:_
this document itself — `TODO.md` corrects an earlier, wrong claim about the
auth gate rather than quietly dropping it; `docs/security/controls.md`
states plainly that ISO 27001 Annex A A.5–A.7 cannot be satisfied by a
repository and that certification needs an external auditor, rather than
listing the framework and letting the reader assume full coverage.

**Auditable.** Every privileged action leaves a trace. _Test:_ role
changes and their audit-log write happen in one transaction
([ADR-0009](adr/0009-security-hardening-p0.md)), not two statements that
can diverge on failure; structured logs carry a trace ID from request to
DB write to error response (`docs/observability.md`).

## Where they conflict

Principles that never conflict aren't doing any work. Two pairs here
genuinely do, and each is resolved with a rule, not left to taste.

### Customizable vs. secure by default

**Rule: secure by default wins; customization is additive, never a way to
weaken a default silently.** A deployer can add fields, adjust workflows,
and configure branding via the `Organization.settings` JSON column and
documented extension points. A deployer cannot, through ordinary
configuration, disable authentication on `/dashboard/**`, turn off audit
logging, or downgrade a cookie's `SameSite` policy — those require editing
source, which is a deliberate, reviewable, git-tracked act, not a settings
toggle. Concretely: the module maturity gate
([ADR-0008](adr/0008-module-maturity-gate.md)) defaults every new module to
_off_ until it's actually authorized and tested, precisely because "easy to
customize" cannot mean "easy to accidentally expose an unauthorized mock
module to real users."

### Fast vs. auditable

**Rule: the request path stays fast; the audit trail is asynchronous where
that doesn't create a gap an attacker can exploit, synchronous where it
would.** A page render doesn't block on a full audit-log flush to disk. A
_privileged mutation_ (role change, permission grant, financial transaction
once M3 lands) does write its audit entry in the same transaction as the
mutation itself
([ADR-0009](adr/0009-security-hardening-p0.md)) — the two or three
milliseconds that costs is not optional, because an audit entry that might
not exist is not an audit trail. Read-path logging (page views, search
queries) is fire-and-forget by design; write-path logging of anything
privileged is not.
