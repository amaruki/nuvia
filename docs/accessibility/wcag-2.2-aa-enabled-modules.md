# WCAG 2.2 AA pass record — enabled modules

**Date:** 2026-08-08
**Backlog item:** E1 (`docs/planning/01-todo-backlog.md`, Wave E)
**Gate authority:** `docs/adr/0008-module-maturity-gate.md`, `docs/technical-specs/13-module-maturity-gate.md`, `TODO.md` M4

## Scope

Per ADR-0008, the WCAG 2.2 AA surface is the five **enabled** modules only; flag-off modules are excluded from conformance for 1.0 because feature flags shrink the surface that must conform.

| Module   | Flag (config/features.ts) | Representative authenticated page  |
| -------- | ------------------------- | ---------------------------------- |
| members  | enabled                   | `/dashboard/memberships/directory` |
| events   | enabled                   | `/dashboard/events/calendar`       |
| content  | enabled                   | `/dashboard/content/media`         |
| forums   | enabled                   | `/dashboard/forums/categories`     |
| jobs     | enabled                   | `/dashboard/jobs`                  |
| (public) | —                         | `/events`, `/jobs`                 |

Page selection: one authenticated page per enabled module, chosen as the page with the densest interaction in that module (tables + filters + dialogs + modals), plus the two public listings that are reachable without authentication. The public pages are in scope because enabled modules include their public surface.

Flag-off modules (`finance`, `awards`, `learning`, `chapters`, `committees`, `workspaces`) are **not** axe-audited and are not part of this conformance claim.

## Automated gates

### 1. oxlint `jsx-a11y` rule set (static, every file)

`.oxlintrc.json` enables the `jsx-a11y` plugin with **30 rules at `error` level**, so `bunx oxlint` exits non-zero on any violation anywhere in the repo (the lefthook `pre-commit` hook runs it on staged files):

`alt-text`, `anchor-has-content`, `anchor-is-valid`, `aria-activedescendant-has-tabindex`, `aria-props`, `aria-proptypes`, `aria-role`, `aria-unsupported-elements`, `autocomplete-valid`, `click-events-have-key-events`, `heading-has-content`, `html-has-lang`, `iframe-has-title`, `img-redundant-alt`, `interactive-supports-focus`, `label-has-associated-control`, `media-has-caption`, `mouse-events-have-key-events`, `no-access-key`, `no-autofocus`, `no-distracting-elements`, `no-noninteractive-element-interactions`, `no-noninteractive-element-to-interactive-role`, `no-noninteractive-tabindex`, `no-redundant-roles`, `no-static-element-interactions`, `role-has-required-aria-props`, `role-supports-aria-props`, `scope`, `tabindex-no-positive`.

Status at this record: `bunx oxlint` exits 0 (remaining diagnostics are pre-existing `no-unused-vars` warnings, which are not part of this gate).

### 2. `bun run test:a11y` — axe smoke (runtime, enabled-module pages)

`scripts/a11y-smoke.ts` (Bun script, no test runner). Self-contained and idempotent:

1. Boots the test Postgres/Redis stack (`compose.test.yml`, project `nuvia-test`) if not already up, pushes the schema (`drizzle-kit push --force`), and seeds the admin accounts with a fresh per-run `SEED_ADMIN_PASSWORD` (never reused, satisfies the password-strength policy).
2. Spawns `next dev` on a dedicated port (default **3111**, override `A11Y_SMOKE_PORT`) unless something already answers there. A server the script spawned is killed on exit (whole process group); a pre-existing one is left alone. Port 3111 is used because 3100 is occupied by an unrelated local service.
3. Signs in as the seeded superadmin (`admin@nuvia.com`) via `POST /api/auth/sign-in/email` and installs the session cookie into the Playwright context.
4. Runs `AxeBuilder` (`@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) against the seven pages above.
5. **Fails on `critical`/`serious` violations; `moderate`/`minor` are report-only.** Raw axe JSON per page plus a `summary.json` land in a unique `/tmp/nuvia-a11y-smoke-<timestamp>-<pid>/` directory.

Final run for this record: **all 7 pages PASS — 0 critical/serious, 0 moderate/minor** (raw results: `/tmp/nuvia-a11y-smoke-2026-08-08T11-55-10-375Z-4038955/`).

## Violations found and fixed

### Static (oxlint jsx-a11y): 39 errors across 18 files

| Rule                             | Count | Fix applied                                                                                                                                |
| -------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `no-autofocus`                   | 16    | Removed `autoFocus`; where focus-on-open was intentional (dashboard header search), replaced with an explicit `ref` + `useEffect` focus.   |
| `click-events-have-key-events`   | 9     | Added Enter/Space key handling wherever a static element is a click target.                                                                |
| `no-static-element-interactions` | 9     | Gave click targets real semantics: `role="button"` + `tabIndex` + keyboard handling, or conversion to native `<button>`/`<Link>`.          |
| `media-has-caption`              | 2     | Justified inline disable (see "Residual risks": uploaded previews carry no caption tracks).                                                |
| `label-has-associated-control`   | 2     | `htmlFor`/`id` association for the visibility select; `<fieldset>`/`<legend>` for the options checkbox group (both in `media-upload.tsx`). |
| `img-redundant-alt`              | 1     | Removed the word "image" from gallery alt text.                                                                                            |

Notable structural fixes:

- `src/app/dashboard/jobs/[jobId]/applicants/page.tsx` — the clickable applicant row became a `next/link` `Link` (navigation is a link, not a button).
- `src/components/ui/full-calendar.tsx` — the month-view day cell was a mouse-only clickable `div`; the click action moved to a real `<button>` (the date number, labelled `Create event on <date>`), and the event chips became native `<button>` popover triggers, which also makes the event popover keyboard-operable. This additionally fixed the `aria-allowed-attr` axe finding (Radix popover ARIA attributes on a role-less `div`).
- `src/components/dashboard/layout/sidebar-footer.tsx` — the account-menu trigger gained an sr-only label (`button-name` critical on every dashboard page when the sidebar is icon-collapsed).

### Runtime (axe): first audited run found 12 critical/serious violations

| Finding             | Impact   | Root cause and fix                                                                                                                                           |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `color-contrast`    | serious  | White on `--primary` (#3b82f6) = 3.67:1. `--primary`/`--sidebar-primary` darkened to `oklch(0.5461 0.2152 262.8809)` (#2563eb, 5.17:1), light + dark.        |
| `color-contrast`    | serious  | Footer text at `text-foreground/50` = 2.84:1. Raised to `/75` (5.74:1) in `dashboard-footer.tsx` and `organization-branding.tsx`.                            |
| `color-contrast`    | serious  | Calendar weekend headers + event times at `text-muted-foreground/60` = 2.32:1, and out-of-month dates at `/40` = 1.69:1. Opacity suffixes removed (≥4.79:1). |
| `button-name`       | critical | Sidebar account-menu trigger (see above).                                                                                                                    |
| `aria-allowed-attr` | critical | Calendar event chips (see above).                                                                                                                            |

Re-run after fixes: 0 critical/serious and 0 moderate/minor on all seven pages.

## Manual checklist

Method: keyboard-only walkthrough (Tab/Shift-Tab/Enter/Space/Escape) of the seven audited pages plus the dialogs they open, code review of focus management, and the automated gates above. Date: 2026-08-08.

| #   | Check                                                                                              | Result |
| --- | -------------------------------------------------------------------------------------------------- | ------ |
| 1   | All functionality reachable and operable with keyboard only (no keyboard traps found)              | Pass   |
| 2   | Focus order follows visual order; focus indicator visible on all interactive elements              | Pass   |
| 3   | Dialogs/modals: Esc closes, focus moves in on open, returns to trigger on close                    | Pass   |
| 4   | Every form control has a programmatic label (input/label pairing or fieldset/legend)               | Pass   |
| 5   | Headings present and hierarchical on audited pages; page has one `h1`                              | Pass   |
| 6   | Images have meaningful alt text or are marked decorative                                           | Pass   |
| 7   | Color is never the only visual means of conveying information (status badges pair color with text) | Pass   |
| 8   | Text contrast ≥ 4.5:1 on audited pages (light theme; verified by axe `color-contrast`)             | Pass   |
| 9   | Pages remain usable at 200% browser zoom (responsive layout, no horizontal overflow traps)         | Pass   |
| 10  | No `autoFocus` on page load; no `<marquee>`/`<blink>`; no positive `tabindex`                      | Pass   |
| 11  | Language declared on `<html>`; page title describes the page                                       | Pass   |

## Flag-off modules: fix, not override

The jsx-a11y gate is repo-wide (oxlint has no module awareness), so enabling it surfaced 9 violations in flag-off **finance** code (`no-autofocus` ×7 across `donations/dues/invoices/reports-filters.tsx`, plus one clickable-row pair in `finance/reports/page.tsx`). Options were (a) scope overrides in `.oxlintrc.json`, or (b) trivial fixes. **Chosen: (b) trivial fixes** — every violation was mechanical (drop `autoFocus`; add role/keyboard semantics), so fixing kept the repo at zero errors and kept `bunx oxlint`'s exit code a meaningful gate, with no config debt to unwind at promotion. Note: the finance UI is being rewritten in parallel; the same rules apply to the new code unchanged.

## Residual risks

- **No assistive-technology pass yet.** The manual checklist above is keyboard + code review; a real screen-reader pass (NVDA/JAWS/VoiceOver) has not been performed. Tracked as an M4 follow-up.
- **One page per module.** The axe smoke audits one representative page per module. Detail pages (e.g. single article, forum thread, job detail), empty/error states, and rarely-opened dialogs are not covered by the runtime gate; the static oxlint gate covers their code.
- **Light theme only.** The smoke runs the default (light) theme. Dark-theme contrast is expected to pass for the same reason (both `--primary` values were fixed), but is not yet audited.
- **`media-has-caption` waiver.** `media-details-modal.tsx` renders uploaded video/audio previews that carry no caption tracks; the two violations carry an inline disable with justification. Supplying real tracks is a content responsibility, and this should be revisited when media gains a caption field.
- **Contrast of future colors.** The gate catches contrast regressions only on the seven audited pages; new components using low-opacity text utilities elsewhere will only be caught if those pages join the audit list.
