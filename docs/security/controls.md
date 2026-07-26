# Security Controls

## Framework choice

OWASP ASVS + NIST SSDF (SP 800-218), and ISO/IEC 27001 Annex A **A.8 only**.
Both ASVS and SSDF are free, self-assessable, and map to checkable engineering practices — the realistic pair for a small OSS project without an audit budget.
SLSA build provenance covers the supply-chain/artifact-signing requirement separately (`docs/supply-chain.md`, `docs/release.md`).

ISO 27001 Annex A is included narrowly and honestly.
A.5 (organizational controls), A.6 (people controls — screening, NDAs), and A.7 (physical controls — facilities) describe an _organization_, not a _codebase_.
A repository cannot satisfy them, and certification requires an external auditor regardless of what the code does.
Only **A.8 (technological controls)** is meaningful here, and it's covered by the ASVS/SSDF mapping below rather than duplicated.
Claiming broader ISO 27001 coverage than this would violate the "transparent" principle in `docs/PRINCIPLES.md`.

## What's CI-verified vs. process-only

| Control area                | ASVS / SSDF ref | Status                      | Verification                                                                                |
| --------------------------- | --------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| Authentication              | ASVS V2         | Partial                     | better-auth session handling; no CI test yet (`TODO.md` M2 test #1–2)                       |
| Access control              | ASVS V4         | Partial                     | `requirePermission` exists; route coverage not CI-enforced yet (`TODO.md` M1/M2)            |
| Error handling              | ASVS V7         | Not started                 | RFC 9457 not yet implemented (`docs/adr/0002-rfc9457-error-contract.md`)                    |
| Data protection             | ASVS V8         | Partial                     | See `docs/security/privacy.md`; DSAR/erasure not implemented                                |
| Injection prevention        | ASVS V5         | CI-verified by construction | Drizzle's parameterized queries — no raw SQL exists in the codebase                         |
| Secure build (protect code) | SSDF PS.1       | Process-only                | Local hooks (`docs/adr/0010-ai-agent-commit-guard.md`); branch protection deferred to owner |
| Build provenance            | SSDF PS.2       | Not started                 | SLSA attestation (`TODO.md` M4)                                                             |
| Reuse of secure software    | SSDF PW.4       | Partial                     | `bun audit` runs; no CI gate yet (`docs/supply-chain.md`)                                   |
| Vulnerability response      | SSDF RV.1       | Documented                  | Triage-by-reachability policy (`docs/supply-chain.md`); no SLA tracking tooling yet         |

"CI-verified by construction" means the property holds because of how the
code is written (a typed query builder cannot emit string-concatenated
SQL), not because a specific test asserts it — worth distinguishing from
controls that are CI-verified by an actual assertion, which this project
has very few of today (`TODO.md` M2's first-ten-tests list is the start).

## Update discipline

This table is edited in the same PR as the control it describes changing
status — a status here that doesn't match the code is worse than no table
at all.
