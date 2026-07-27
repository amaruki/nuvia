# Security Controls

## Framework Choice

This project uses OWASP ASVS, NIST SSDF (SP 800-218), and ISO/IEC 27001 Annex A **A.8 only**. ASVS and SSDF are free, self-assessable, and map to checkable engineering practices. This pairing is realistic for a small OSS project without an audit budget. SLSA build provenance covers the supply-chain and artifact-signing requirements separately (`docs/supply-chain.md`, `docs/release.md`).

This document limits ISO 27001 Annex A to a narrow, honest scope. A.5 (organizational controls), A.6 (people controls, such as screening and NDAs), and A.7 (physical controls, such as facilities) describe an _organization_, not a _codebase_. A repository cannot satisfy them. Certification always requires an external auditor. This requirement holds regardless of what the code does. Only **A.8 (technological controls)** is meaningful here. The ASVS and SSDF mapping below covers A.8. This document does not duplicate that coverage. A claim of broader ISO 27001 coverage than this would violate the "transparent" principle in `docs/PRINCIPLES.md`.

## Control Verification Status

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

"CI-verified by construction" means the property holds because of how the code is written. For example, a typed query builder cannot emit string-concatenated SQL. This status does not mean that a specific test asserts the property. This status differs from controls that are CI-verified by an actual test assertion. This project has very few such controls today. The first-ten-tests list in `TODO.md` M2 is the start.

## Update Discipline

Contributors must edit this table in the same PR that changes a control's status. A status in this table that does not match the code is worse than no table.
</content>
