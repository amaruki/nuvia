# 8. Non-Functional Requirements

No load testing or capacity planning has been performed against this codebase yet; the targets below are the project's stated intent (`docs/PRINCIPLES.md`), not measured SLAs. Each row states its source so a later NFR revision can tell which numbers are real measurements versus design targets.

| Concern                                  | Target                                                                                         | Source                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Time-to-first-byte / time-to-interactive | Prioritized over micro-benchmarks; Server Components by default                                | `docs/PRINCIPLES.md`, "Fast"                        |
| Scaling assumption                       | Scales with association size (members, events, chapters), not server count first               | `docs/PRINCIPLES.md`, "Scalable"                    |
| Shared state                             | Stateless request handling; Redis (not in-process memory) for anything shared across processes | [ADR-0003](../adr/0003-single-rate-limiter.md)      |
| Rate limits                              | Login 5/15min, signup 5/hour, generic API 100/15min (Section 7.3)                              | `src/lib/rate-limit.ts`                             |
| Availability                             | Not yet targeted; no SLA defined                                                               | Design gap, not a decision                          |
| WCAG conformance                         | 2.2 AA, on every enabled module only                                                           | `docs/PRINCIPLES.md`, "User-friendly"; `TODO.md` M4 |

Multi-association scaling is designed to be additive, not a rewrite, because of the single-association tenant seam ([ADR-0007](../adr/0007-single-association-tenant-seam.md)) — every domain table already carries an `orgId`-ready column, even though only one `Organization` row exists today.
