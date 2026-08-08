# ASD-STE100 audit report — full documentation sweep

- Documents: all 32 Markdown files under `docs/` and the repository root
  (see file list in "Scope" below).
- ASD source and issue: none available in this environment. No lawful
  ASD-STE100 Part 2 dictionary copy and no populated project glossary
  (`/home/amaruki/.claude/skills/ste100/dictionary/company-terms.yaml` is
  empty) were available for this pass. Every vocabulary/word-approval
  decision below is `UNVERIFIED`, not certified, per
  `dictionary/README.md`'s fail-closed instruction.
- Dictionary/glossary and version: none (see above).
- Mechanical scan: `python3 scripts/audit_ste.py <file> [--procedural]` run
  on every file, both before and after the line-reflow pass described
  below. See "Known tool limitation" for why post-reflow word-count
  findings needed manual re-verification rather than being taken at face
  value.
- Reviewer: 7 parallel subagents (one per file group below), coordinated
  and consolidated by the orchestrating session.
- Gate re-run after last fix: yes, for every file, after both the content
  pass and the reflow pass.
- Result: **`STE findings unresolved`** — not `STE audit passed`. See
  "Final gate" for exactly what remains open and why.

## Scope

| Group | Files                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SECURITY-WAIVERS.md`, `CHANGELOG.md`                                                                |
| B     | `README.md`, `CLAUDE.md`, `CODING_STANDARD.md`                                                                                                               |
| C     | `TODO.md`                                                                                                                                                    |
| D     | `docs/PRINCIPLES.md`, `docs/observability.md`, `docs/release.md`, `docs/supply-chain.md`                                                                     |
| E     | `docs/adr/README.md`, `docs/adr/0001` through `0006`                                                                                                         |
| F     | `docs/adr/0007` through `0013`                                                                                                                               |
| G     | `docs/architecture/overview.md`, `docs/architecture/data-model.md`, `docs/security/controls.md`, `docs/security/privacy.md`, `docs/security/threat-model.md` |

Every file was: (1) revised for STE100 grammar/structure (active voice,
permitted verb forms only, no contractions, no semicolons, sentence-length
caps, correct classification of description/note/procedure content,
paragraph caps), (2) reflowed so each paragraph/list item is a single
unwrapped source line instead of the repository's prior manual hard-wrap
convention (a formatting preference stated mid-session, unrelated to
STE100 itself), and (3) manually re-checked sentence-by-sentence against
the word caps, because the reflow exposed a mechanical-scanner limitation
(below) that made its own word-count output unreliable.

## Findings

Severity definitions: `audit/00-severity.md` in the `ste100` skill (outside this repository, so not linked as a relative path here).

| Severity                                                       | Location                                                                 | Rule                                                        | Evidence                                                                                           | Correction/status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAJOR                                                          | `CODE_OF_CONDUCT.md` (Grievance/complaints line)                         | STE-03.4, modal+be+participle                               | "All complaints will be reviewed and investigated promptly and fairly"                             | Left uncorrected — file is a recognizable Contributor Covenant v2.1 derivative; rewriting risks breaking template fidelity. Needs an owner decision, not a unilateral rewrite.                                                                                                                                                                                                                                                                                                                                                               |
| MAJOR                                                          | `CODE_OF_CONDUCT.md` ("Our Standards" list)                              | Rule 3, banned gerund/progressive list items                | Every list item is gerund-led ("Demonstrating...", "Trolling, insulting...")                       | Left uncorrected, same template-fidelity reason. A full fix means rewriting every item — an owner decision.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MAJOR                                                          | `CHANGELOG.md` (all Added/Changed/Fixed/Removed sections)                | Rule 3, recurring gerund/reduced-clause noun-phrase bullets | e.g. "Drizzle ORM as the data layer, replacing Prisma"                                             | Left uncorrected — this is the Keep a Changelog convention, a recognized external format; rewriting only some bullets would break rule 09's internal-consistency requirement worse than leaving the convention alone throughout.                                                                                                                                                                                                                                                                                                             |
| MAJOR                                                          | `docs/security/controls.md`, Verification column (6 rows)                | STE-08.1, semicolons                                        | 6 semicolons inside table cells                                                                    | Left uncorrected — explicit instruction to freeze this table's content (status words and scope claims are load-bearing) took priority over the semicolon rule. Pre-existing in source, not introduced by this pass.                                                                                                                                                                                                                                                                                                                          |
| MAJOR (false positive)                                         | `CODING_STANDARD.md` lines ~192, 198, 199                                | STE-08.1 scanner flag                                       | Semicolons inside a literal ` ```ts ` mock code block                                              | Dismissed — script is not fence-aware; these are real TypeScript syntax, not prose.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| MINOR (pattern, ~dozens of instances across nearly every file) | ADRs, README, TODO.md, architecture/security docs                        | STE-03.4/03.6 scanner flag on "is/are + past participle"    | e.g. "is pinned", "are deleted", "is wired", "is tracked"                                          | Reviewed as the permitted past-participle-as-adjective describing a resulting state, not true passive voice, per `rules/03-verbs.md`'s explicit carve-out. This is the single most common candidate finding across the whole sweep; every instance was individually triaged, none silently dismissed as a batch.                                                                                                                                                                                                                             |
| MINOR                                                          | `docs/adr/0009-security-hardening-p0.md` title                           | Residual passive framing                                    | "what's tracked" → "what is tracked"                                                               | Left as-is; further rewrite risked destabilizing a heading used as a cross-reference anchor.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| MINOR                                                          | `docs/adr/0012-bun-package-manager-and-runtime.md`                       | Structural note                                             | One real imperative ("Flip that flag only after...") embedded in an otherwise-DESCRIPTION document | Preserved as a genuine instruction rather than weakened into a description; flagged for a possible future PROCEDURE-classified callout, not restructured unilaterally.                                                                                                                                                                                                                                                                                                                                                                       |
| MINOR                                                          | `docs/adr/0013-oxlint-oxfmt-toolchain.md` title vs. `docs/adr/README.md` | Cross-file consistency                                      | Title "oxlint + oxfmt replace ESLint + Prettier" reproduced verbatim in the ADR index table        | Verified consistent between both files — left unchanged in both, by design.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MINOR                                                          | `README.md` (2 locations)                                                | STE-03.6 scanner flag                                       | "what is planned"                                                                                  | Adjectival predicate parallel to "what is mock" — state description, not action passive.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| MINOR                                                          | `CLAUDE.md`, "Dependency versions are pinned, not ranged"                | Passive heading                                             | —                                                                                                  | Headings/labels treated as titles (literal/label exemption), not audited as prose sentences.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| MINOR                                                          | `CODING_STANDARD.md` (~11 locations)                                     | GR-8, possessive 's                                         | `codebase's`, `handler's`, `Drizzle's`, etc.                                                       | Left in place — GR-8 explicitly frames cautious possessive use as a style preference, not a rule violation; all are short, unambiguous technical-noun possessives.                                                                                                                                                                                                                                                                                                                                                                           |
| MINOR                                                          | `CODING_STANDARD.md` (2 locations)                                       | GR-6, "etc."                                                | —                                                                                                  | Left in place — rewrite read worse in context; GR items are advisory, not a numbered-rule MAJOR.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| UNVERIFIED (vocabulary, universal)                             | every file                                                               | No lawful ASD dictionary or populated glossary              | Every substituted or retained word choice                                                          | Cannot be certified approved or unapproved. Ordinary correct English was used throughout rather than guessed-at STE synonyms. Higher-consequence individual calls, flagged by name for visibility: "hiding" (`SECURITY.md`, replacing "papered over"), "through" replacing "via" ×4 (`SECURITY-WAIVERS.md`), "advertised"→"reported" (`TODO.md`), "documentation"/"authorization" full-word expansions (`docs/adr/0008`), "warranted", "sibling", "forcing function", "independent opinion" (`README.md`, `docs/adr/0001`, `docs/adr/0005`). |

## Content-accuracy findings (outside STE scope, found during the pass)

Per this repository's own convention (`CLAUDE.md`: log a bug outside your
task's scope rather than fixing it silently), three factual/documentation
staleness issues surfaced during the STE100 read-through. Two were
verified against the codebase and fixed directly, consistent with how
similar staleness was corrected earlier this same session; one was
flagged rather than resolved because it requires runtime/test verification
this pass could not perform.

| Item                                                                                                                                                                                                                                                                                                                                                  | Status                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `CODING_STANDARD.md` §3.3 claimed RFC 9457 conversion happens "once `docs/adr/0002-rfc9457-error-contract.md` lands." `src/lib/http.ts` already exports `problemResponse()`, in use across routes.                                                                                                                                                    | **Fixed** — rewritten to state the landed mechanism directly.                                             |
| `TODO.md`'s "Good first issues" listed "pick and migrate off one duplicate dependency, once its ADR lands," naming the toast library and mail transport as examples. `TODO.md`'s own M2 section (a few dozen lines earlier) already documents all three flagged pairs as resolved, with no ADR needed for any of them.                                | **Fixed** — struck through and replaced with a note pointing at the M2 finding.                           |
| `TODO.md`'s "Good first issues" claims "16 dead nav links" remain. `tests/nav-links.test.ts` is known (from an earlier investigation this session) to check only that leaf paths resolve to a real page — a parent-only nav item would not be covered, so the true current count is unverified without running the test suite and inspecting results. | **Flagged, not resolved** — reworded to note the verification gap instead of asserting a specific number. |

## Known tool limitation (not a project defect)

`scripts/audit_ste.py` counts words per physical source line
(`text.splitlines()`), not per sentence, and applies the 25-word
descriptive cap only to lines beginning `NOTE:`/`Note:` — ordinary
descriptive prose gets no word-count check at all unless `--procedural`
is passed, and `--procedural` then wrongly applies the 20-word procedural
cap to everything. This was a reasonable design under the repository's
prior one-sentence-per-line hard-wrap convention, but it silently breaks
once a paragraph is reflowed to one long line: the script then sums
several real sentences' word counts into one bogus "sentence has N words"
finding. Every group worked around this by manually verifying sentence
boundaries (splitting on `.`/`?`/`!`) against the true caps after
reflowing, rather than trusting the script's post-reflow output. This
manual check caught roughly 25 genuine sentence-length violations across
the sweep that the script structurally could not have found even before
the reflow (a few were already borderline across two physical lines
before reflowing made the true sentence visible on one line). The
MODAL_BE / AUXILIARY / PASSIVE / CONTRACTION / SEMICOLON regex checks are
unaffected by this limitation and remained trustworthy throughout.

## Accepted exceptions

None recorded. The MAJOR findings above (`CODE_OF_CONDUCT.md` ×2,
`CHANGELOG.md`, `docs/security/controls.md`'s frozen table) and the
blanket vocabulary `UNVERIFIED` status are not yet formally accepted by
name with a reason and an accountable approver — that is an owner
decision, not something this pass can grant itself. Until recorded here,
they keep the gate at `STE findings unresolved`.

| Finding      | Reason accepted | Approver | Date |
| ------------ | --------------- | -------- | ---- |
| _(none yet)_ |                 |          |      |

## Final gate

- [x] Source fidelity checked — every file's facts, figures, ADR
      statuses, and file:line citations were diffed against the
      pre-revision content; no technical meaning changed except the two
      verified content-accuracy fixes logged above.
- [x] Content classification checked — description/note/procedure
      boundaries identified per file (README's install steps and Google
      OAuth steps were the only genuine PROCEDURE passages found across
      all 32 files).
- [ ] Vocabulary checked against authoritative data — **not possible**,
      no lawful dictionary source configured; every decision is
      `UNVERIFIED` by necessity, not by omission.
- [x] Grammar and sentence forms checked, including General
      Recommendations.
- [x] Procedures and descriptions checked, including paragraph rules and
      note validity.
- [x] Terminology ledger checked for one canonical term per item — no
      synonym drift found across the sweep (spot-checked: "association",
      "module", "role", "permission", "flag", "gate" used consistently).
- [ ] Safety instructions checked — n/a, no WARNING/CAUTION/DANGER content
      exists in this documentation set.
- [x] Punctuation and word count checked, including the semicolon ban
      (see the known tool limitation above for how word count was
      actually verified, manually, post-reflow).
- [x] Mechanical scan findings all triaged (confirmed, reclassified, or
      dismissed as false positive with a stated reason) — see Findings
      table.
- [ ] Accepted exceptions recorded with reason and approver — **open**,
      see "Accepted exceptions" above. No open `BLOCKER` exists anywhere
      in the sweep.

**Report: `STE findings unresolved`.** Zero `BLOCKER` findings anywhere.
Four `MAJOR` findings remain open, all deliberately left for template- or
frozen-content-fidelity reasons rather than overlooked, and all need an
explicit owner exception to close. Vocabulary is `UNVERIFIED` throughout
the entire 32-file set because no lawful ASD-STE100 Part 2 dictionary or
populated project glossary exists in this environment — closing that gap
requires either a lawfully licensed dictionary source or an explicit
owner decision to accept the risk.

## Targeted re-audit: integration test instructions

- Documents: `README.md`, `CONTRIBUTING.md`, and
  `docs/adr/0010-ai-agent-commit-guard.md`.
- Change: Add the isolated integration test command and its service
  requirements.
- ASD source and issue: ASD-STE100 Issue 9 workflow. No lawful Part 2
  dictionary source was available.
- Dictionary/glossary and version: none.
- Mechanical scan: run on 2026-07-27 after the final text change.
- Reviewer/date: Codex, 2026-07-27.
- Result: **`STE findings unresolved`** because vocabulary approval stays
  `UNVERIFIED`.

The new instructions preserve the command names and service names as
literals or technical nouns. The source for each technical behavior is
`package.json`, `lefthook.yml`, `compose.test.yml`, or
`.github/workflows/ci.yml`.

The scan reported no candidate on a new line in `README.md` or the ADR.
The scan reported two candidates on changed lines in `CONTRIBUTING.md`.
The scanner counted all sentences on each physical line as one sentence.
Manual sentence counts show that each new sentence stays within its
applicable limit.

The changed passages contain no safety instruction, semicolon,
contraction, synonym drift, or hidden command. The terminology is
consistent: "integration test command," "PostgreSQL," "Redis," and
"Docker Compose." The absence of an approved vocabulary source remains
an open `UNVERIFIED` finding. No new `BLOCKER` or `MAJOR` finding remains.
