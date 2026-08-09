# Nuvia: Frontend Improvement Plan (Frontoffice + Backoffice)

> **Date:** 2026-08-08
> **Scope:** every user-facing surface, landing (`src/app/page.tsx` + `src/app/_components/`), public/member flows (`src/app/(public)/`), auth (`src/app/auth/`), and the dashboard backoffice (`src/app/dashboard/**` + `src/components/`).
> **Method:** three parallel read-only audit passes (frontoffice, backoffice, design system) against the UI/UX Pro Max priority framework (accessibility > touch > performance > style > layout > typography/color > animation > forms > navigation > data display), plus direct verification of every load-bearing claim cited below. No code was changed by this audit.
> **Companion docs:** `docs/accessibility/wcag-2.2-aa-enabled-modules.md` (WCAG 2.2 AA pass record), `docs/planning/02-claim-gap-map.md` (claim verification), `plans/` (landing motion plans 001–006).

---

## 0. Design-reference radar (UIZZE)

Per the ui-radar workflow, the UIZZE catalogue API was queried for comparable real-world screens before writing recommendations: `association management dashboard`, `admin dashboard sidebar table`, `event registration page`, `membership portal landing`, plus broader retries (`dashboard`, `analytics`, `event`, `login`, `landing`; `filter=web`).

**Result: the public API returned HTTP 200 with an empty `results` array for every query.** Zero usable references were retrieved, so this plan contains no external screenshot evidence and no reference links, every recommendation below is grounded in the codebase itself and in the repo's own established conventions (the landing motion contract, the content-module table pattern, the jobs apply-form pattern). Nothing was fabricated to fill the gap.

> For live UIZZE search, screenshots, flows, comparisons, and reference briefs inside your coding agent, get [UIZZE Full Access](https://uizze.com/pricing).

---

## 1. Executive summary

**Health scorecard** (A = shippable, F = blocks release):

| Surface                   | Grade | One-line verdict                                                                                                                                                      |
| ------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing                   | B+    | Solid server-rendered build with an exemplary motion contract; stale "five modules" copy undermines the product's honesty promise.                                    |
| Public events             | D     | Real data underneath, but broken flows: invisible state banners, hardcoded `"current-user-id"`, fabricated certificates, a fake-save edit page, `alert()` everywhere. |
| Public jobs               | B-    | Good apply form; token-violating palette and a bare list page.                                                                                                        |
| Member & content surfaces | F     | Members, Content, Forums are advertised live but have zero frontoffice pages; the backoffice manages data nobody can consume (planned as Phase 2).                    |
| Auth                      | C     | Working RHF+zod forms, but a real checkbox bug, 404 legal links, dead/mis-targeted animations, no reduced-motion gating.                                              |
| Dashboard shell           | C+    | Sound sidebar/header architecture; decorative search, stub pages in nav, role-filter divergence from the server gate.                                                 |
| Dashboard modules         | D+    | Two camps: real-data modules with inconsistent table capability vs. mock surfaces (overview, tiers, calendar, create/edit) presented as live with no labeling.        |
| Design system             | B-    | Complete OKLCH tokens + 44 shadcn primitives at ~70% maturity, undermined by uneven adoption (hand-rolled states, 100+ palette bypasses, emoji icons).                |

**The single biggest theme is trust.** The repo's stated identity is radical honesty (public roadmap, corrected audit findings in `TODO.md`, claim-gap map). Yet an admin today sees fabricated numbers on `/dashboard` presented as real-time data, a treasurer sees membership tiers "saved" by a handler that only logs, and a member sees certificates with client-side-fabricated verification codes. The permission audit for this plan surfaced one more trust item: Stripe webhooks 401 at the middleware before signature verification runs (UI-41), so no paid membership can complete end to end. Closing that gap is Phase 1.

**The second theme is coverage, and it is a build, not a fix.** The landing declares Members, Events, Content, Forums, and Jobs live (`src/app/_components/landing-data.ts:32`), yet only Events and Jobs have frontoffice pages. Content and Forums are complete end-to-end in the backoffice, schema, service layer, authorized API, management UI, and nowhere consumable: no member can read an article, view or write a forum post, or see any profile, including their own public identity. The forum product exists only as a moderation queue; the member sidebar even advertises a Forums section whose children are all admin-gated. These missing pages are planned as Phase 2.
**The third theme is product definition for the frontoffice.** The maintainer sets three purposes for the landing and frontoffice: promotion of the open-source product, a demo mode that shows the features of both offices, and a documentation portal managed separately from the source. To decide what may surface where, this plan now contains a business-logic exposure audit (section 3): every module mapped to its audience (public, member, backoffice), the lifecycle state that makes a row audience-ready, and the fields that must never leave the backoffice. Every Phase 2 build is acceptance-tested against that matrix.

**What is already strong (do not regress):**

- WCAG 2.2 AA automated gates: 30 jsx-a11y oxlint rules at error level + 18-page axe smoke, all passing (`docs/accessibility/wcag-2.2-aa-enabled-modules.md`).
- OKLCH semantic color system, light + dark, WCAG-adjusted (`src/app/globals.css:11-102`), correctly wired to `data-theme` (`src/app/layout.tsx:39`).
- Landing motion contract: CSS-only, transform/opacity-only, tokenized easing, pointer-fine hover gating, full `prefers-reduced-motion` block (`src/app/globals.css:500-558`).
- Reference implementations that already exist in-repo: content articles table (sort + pagination + bulk + empty states), jobs apply form (session gate + Alert + zod), `MobileNav` sheet, `settings/general` server component with permission gate.

**Verified headline findings** (spot-checked directly against source during this audit):

- `src/app/dashboard/page.tsx:32`, `const userRole: UserRole = "admin"; // Change to "admin" to see admin widgets`; `:46-64` fake stat fetchers; `:67-91` poll them into the shared context as "real-time" stats.
- `src/app/dashboard/memberships/tiers/page.tsx:67`, `// Mock data - replace with actual API call`; `:247-251,:279-284` save handlers log and close the modal as if persisted.
- `src/components/events/event-registration-form.tsx:96,:113`, "Registration Closed" / "Event Full" banners render at `opacity: "0.1"`; the second also references a nonexistent `var(--chart-5-foreground)`.
- `src/app/auth/login/page.tsx:218`, Radix `Checkbox` wired with RHF `register` (Radix reports via `onCheckedChange`), so "Remember me" can never be checked.
- Metrics: **314 of 497** TSX files are `"use client"` (63%, vs ADR-0006's server-first rule); **11** files use raw `<img>` vs 11 using `next/image`; **52** `aria-label` occurrences app-wide; **0** `error.tsx`/`global-error.tsx` and exactly **1** `loading.tsx` in the whole route tree; **0** `prefers-reduced-motion` handling in TSX (only in landing CSS).
- Dev-run boot failure (found and fixed during this review): `src/lib/actions/auth.actions/index.ts` was a `"use server"` barrel whose re-exports Turbopack rejects ("Only async functions are allowed to be exported in a 'use server' file"), so `/events`, `/jobs`, and `/auth/login` returned HTTP 500 while `bun run typecheck` passed clean; the directive was removed from the barrel and all five primary routes verified rendering (UI-37).

---

## 2. Phase 1: Trust & functional integrity (P0, blocks release)

Decision rule for every mock/fake surface: **wire it to the real service, or hide it behind an honest label.** "Keep it but make it look real" is the current state and is exactly what Phase 1 removes. Note `docs/planning/02-claim-gap-map.md` row 1 verified "no mock read path remains" by checking for `mock-*.ts` files, the items below are _inline_ mocks in page components that sweep missed. After Phase 1 lands, re-verify that row per the repo's claim standard.

### UI-01 Dashboard overview: real data or honest preview (CRITICAL)

- `src/app/dashboard/page.tsx:32`, replace the hardcoded `"admin"` role with the session role.
- `src/app/dashboard/page.tsx:46-91`, delete the `setTimeout` stat fakers and the `useRealtimeUpdates` polling that broadcasts them via `updateMemberStats`/`updateEventStats` into `DashboardProvider`. D1 decided: build real aggregate queries for every widget now (member/event counts already exist in services; add the trend and finance aggregates), no widget ships on placeholders.
- Widget defaults: `finance-widget.tsx:27-33,:53-56`, `analytics-widget.tsx:29-33,:48-51`, `member-statistics-widget.tsx:25-29` (note its numbers contradict the page's own mock: 987 vs 892), `quick-navigation-widget.tsx:27-100` (fake badges; `handleNavigate` is a no-op, `:111-117`). Widgets without real props must render empty states, not `mockData` defaults.
- Sidebar nav badges are hardcoded counts: `src/lib/navigation-data/events.ts:10` ("2"), `memberships.ts:39` ("3"), `communications.ts:23` ("5"). Compute or remove.

### UI-02 Fake submissions presented as success (CRITICAL)

- `src/app/dashboard/events/create/page.tsx` and `src/app/dashboard/events/[id]/edit/page.tsx:161-165`, `setTimeout` + redirect with no service call. A real `createEvent`/update path exists; wire it or remove the pages (the calendar's dead create dialog, `calendar/_components/event-dialog.tsx:49-135`, uncontrolled inputs, no submit, should be deleted either way).
- `src/app/(public)/events/[id]/edit/_components/use-edit-event-form.ts:139-142`, same pattern on the _public_ organizer edit page (the save handler moved out of `page.tsx` in the form split): edits silently discarded. Wire to the real update service with zod/RHF validation or remove.
- `src/app/dashboard/memberships/tiers/page.tsx:247-251,:279-284`, save handlers log only; wire to the membership-tier service (schema exists) or label the page preview. Verified live in this review's dev run: the database holds 0 membership_tiers and 429 users, yet the page renders 6 tiers, "2,954 total members (+12% from last month)", and per-tier member counts, all fabricated.

### UI-03 Fabricated member-facing data (CRITICAL)

- `src/app/(public)/events/certificates/page.tsx:24`, `getUserEventRegistrations("current-user-id")`; verification codes fabricated client-side; navigates to `/certificates/[id]` and `/certificates/verify/[code]` (`:85,:90`) which do not exist. D2 decided: build the real verification flow (member's own ACTIVE certificates; public verification by `verificationCode`); take this fabricated page down immediately and rebuild it honestly. Members currently see fake credentials presented as real.
- `src/app/(public)/events/[id]/page.tsx:166`, `event.organizerId === "current-user-id"` gates the Edit button (never renders). Replace with the session user.
- `src/app/dashboard/events/calendar/_components/calendar-data.ts`, `sampleEvents` (Dec 2024) power all three tabs, with fabricated attendee counts (`_components/upcoming-tab.tsx`) and an Indonesian date-fns locale (`_components/calendar-view.tsx`). Wire to the real event service (the full-calendar component is real) or label preview. (Formerly `page.tsx:71-124,:422,:21,:173`; split into `_components/` parts.)
- `src/app/dashboard/forums/_components/forum-layout.tsx:54,:61,:68`, hardcoded tab counts 4/2/3 beside components that fetch real counts.

### UI-04 Broken interactive basics on frontoffice (HIGH)

- `src/app/auth/login/page.tsx:218`, wrap `rememberMe` in `Controller` as signup already does (`src/app/auth/signup/page.tsx:251-254`).
- `src/components/events/event-registration-form.tsx:96,:113`, remove `opacity: "0.1"` from both state banners; render via the `Alert` component with the destructive variant; fix the nonexistent `--chart-5-foreground` reference. Also render the banner when the form is hidden (closed + not full currently yields a blank card).
- `src/app/auth/signup/page.tsx:264,:268`, `/terms` and `/privacy` links 404. Create the routes or remove the links; use `Link`, not raw `<a>`.

### UI-05 Deceptive admin controls (HIGH)

- Users directory: `lastLoginAt` and `location` are never mapped by `toUserProfile` (`src/app/dashboard/users/directory/page.tsx:30-50`) yet the table offers a sortable Last Login column (`user-table.tsx:242,:379-383`) and a Location facet that silently filters out every row (`user-filter.tsx:349-390`). `phoneVerified: false` is hardcoded (`directory/page.tsx:45`). Map the fields or remove the facets/column.
- Directory crash (verified live): `fetchMembersPage` validates `/api/v1/members` against `memberApiItemSchema` (`src/lib/hooks/use-memberships/members-api.ts:12-13`) where `image`/`bio` are `z.string().nullable()`; the API omits both fields when unset, `nullable()` does not accept `undefined`, and the whole directory collapses to "Could not load the user directory" with a raw zod issue dump rendered to the admin (`directory/page.tsx:221-224`). Make the fields `.nullish()` and render the error state without validator internals (pairs with the UI-09 `TableErrorState`).
- Bulk actions theater: `src/components/users/user-actions.tsx:232,:240` logs "Performing bulk action" and shows success; also unreachable because `currentUserRole` is never passed (`:53,:79,:110`), and `logger.info("DEBUG: ...")` runs in the render body (`:83-90,:114,:141,:154,:159`). Implement or remove the whole bulk bar.
- `src/components/users/user-table.tsx:405-411`, "View Details"/"Edit User" menu items have no onClick; `:188-191` Enter handler is a no-op.
- `src/components/finance/invoices-table.tsx:241-245,:385-388`, "Download PDF" has no handler; `src/app/dashboard/finance/invoices/page.tsx`, "Create Invoice" only toasts, "Export" unhandled.
- `src/app/dashboard/events/registrations/page.tsx:224-228`, cancel mutates with no confirmation (only admin action of its kind); add the AlertDialog+reason pattern used by users/roles.

### UI-37 App boot: "use server" barrel broke the primary routes (CRITICAL, fixed during this review)

Verified during the dev run accompanying this plan (Next.js 16.2.12, Turbopack): `/` returned 200 while `/events`, `/jobs`, and `/auth/login` returned 500, and `/dashboard` redirected to a login page that itself 500s. Cause and resolution:

- `src/lib/actions/auth.actions/index.ts` carried `"use server"` and re-exported the actions from `./credentials`, `./password`, `./profile`, `./sessions`, `./account` (`:21-32`). Turbopack enforces "only async functions may be exported from a use-server file", rejects `export ... from` re-exports, and fails every module graph that includes the barrel (`GET /events 500`).
- `bun run typecheck` passes and a plain bun import of the barrel resolves every export. That is how this survives the current guard set: oxlint, oxfmt, and tsc all skip the directive's export rules.
- Fix applied during this review: the `"use server"` directive was removed from the barrel; each implementation file carries its own. All five primary routes verified at 200/307 afterwards. If a future refactor reintroduces a directive barrel, use inline async wrapper functions or direct imports of the implementation modules instead.
- Users saw a blank white page at four of five entry routes: the 500 shell is the FOUC guard `body{display:none}` plus scripts, no visible content. The route boot smoke (Phase 8, item 7) is the guard that keeps this class of failure visible.

### UI-41 Stripe webhook blocked at the middleware (CRITICAL, blocks UI-33)

`POST /api/v1/webhooks/stripe` authenticates by Stripe signature, not session (`src/app/api/v1/webhooks/stripe/route.ts:2-9`, ADR-0015 §4, `docs/api-specs/webhooks.md`), but `isPublicEndpoint` in `src/proxy.ts:100-117` does not exempt the path. Anonymous Stripe callbacks hit `authenticate()` and 401 before the handler runs, so payment-success and subscription events can never land and the UI-33 membership funnel cannot complete end to end. CI is blind to the gap: the webhook tests invoke the handler directly and bypass the middleware, and `tests/auth-route-coverage.test.ts` regex-matches raw source text, which the route satisfies with the word `requirePermission` inside its docblock. Fix: add the webhook path to the public allow-list (signature verification already happens in the handler) and add a middleware-level test asserting an anonymous webhook POST with a valid signature reaches the handler. Same failure class as UI-37: a guardrail that never exercises the real request path.

**Phase 1 acceptance:** no screen renders hardcoded data without a visible preview label; every Save/Create button persists or is absent; certificates and both `"current-user-id"` stubs gone from source (`grep` returns zero); overview widgets show real numbers or empty states; claim-gap map row 1 re-verified including inline mocks; the five primary routes (`/`, `/events`, `/jobs`, `/auth/login`, `/dashboard`) return rendered pages, zero 500s; an anonymous Stripe webhook with a valid signature reaches its handler (UI-41).

---

## 3. Phase 2: Frontoffice coverage: build the missing member & public pages (P1)

**This phase builds pages that do not exist.** The first audit pass concentrated on surfaces that are present but broken; this one covers surfaces that were never built on top of backoffice data that is already real. Most items are read-side work against existing schemas/services/APIs, no new backoffice plumbing required; the transactional items (UI-33…UI-36) likewise build on services that already exist.

The pattern to replicate already exists in-repo: jobs is the only module with a purpose-built public read path (`src/lib/services/job/public-board.ts`, published-only, expired-filtered, paginated, no permission gate). Each item builds the equivalent read path for its module, consumed by server components per ADR-0006.

### Frontoffice charter: promotion, demo, documentation

The maintainer defines three purposes for the frontoffice. Every item in this phase must serve at least one of them.

**P1. Promote the open-source product.** The landing is the shop window for associations evaluating Nuvia and for self-hosters. Present today: hero, feature grid, module section with an honest roadmap (`LIVE_MODULES` vs `ROADMAP_MODULES` plus a promotion gate), community section, contribute path with QUICK_START, GitHub link (`landing-data.ts:1`), one CTA to signup. Gaps: the stale five-modules claim (UI-25), no demo entry, no docs entry, and a single CTA that conflates "use this instance" with "self-host". Items: UI-25 and UI-38.

**P2. Demo mode.** Visitors must be able to see what the features really look like, both frontoffice and backoffice, without owning an instance. Present today: nothing. The seed creates five privileged accounts and no content (`scripts/seed.ts:43`), and the backoffice is unreachable anonymously by design. A credible demo needs seeded data across the audience-ready lifecycle states of the matrix below, otherwise the demo hides half the product. Items: UI-39, decision D13.

**P3. Documentation portal.** Complete guides covering usage, development, deployment, and maintenance, shown in the frontoffice and managed separately from the open-source source. Present today: a rich internal Markdown corpus under `docs/` (13 technical specs, 16 API spec files, 15 ADRs, security docs, deployment plan, release notes, six module guides) with no rendering route anywhere in `src/app` and no Docs entry in the navigation. Items: UI-40, decision D14.

### UI-38 Landing promotion pass (MEDIUM)

- Split the closing CTA into two intents, "Create an account on this instance" and "Self-host with the MIT source" (`cta-section.tsx:31-36` is one button to `/auth/signup` today; the QUICK_START card in the contribute section is the natural self-host target).
- Add Docs (UI-40) and Demo (UI-39) entries to `NAV_LINKS` (`landing-data.ts:3-8`) and the site footer.
- Fold UI-25 in here: derive module claims from `MODULE_FLAGS` so promotion copy cannot drift from reality.
- Social proof (stars, instance count) only when fetched live; hard-coded numbers violate the honesty promise.

### UI-39 Demo mode: show the product with data in it (HIGH, D13 decided: stages 1+2+3)

- Stage 1, demo content. Add `scripts/seed-demo.ts` that seeds audience-facing content through the existing services, so seeding also exercises the write paths: organization singleton; active membership tiers; events spanning PUBLISHED, REGISTRATION_OPEN, and IN_PROGRESS at both PUBLIC and MEMBERS_ONLY visibility; job postings that are PUBLISHED with live deadlines; PUBLISHED articles plus one ANNOUNCEMENT; forum categories with PUBLISHED posts; ACTIVE chapters and committees; a few courses and one ACTIVE certificate. Every Phase 2 page then lands on data, and the promotion purpose (P1) gets something real to point at.
- Stage 2, demo entry. An "Explore the demo" CTA on the landing that enters the frontoffice against demo data; label the instance as a demo in the footer; reset demo data on a schedule and say so in the label.
- Stage 3, sandbox backoffice (D13). A disposable demo account with a rotating credential and a nightly reset job; a banner across every dashboard page: "Demo instance, data resets daily". Constraints: never reuse the seeded admin accounts; the demo role must not reach settings, payments, webhooks, or backup and database tools (gate those pages off for the demo role); rate-limit the demo login.

### UI-40 Documentation portal (HIGH, D14 decided: separate source repo, rendered in-app)

- Render the documentation under `/docs` for three audiences: users (per-module usage guides; `docs/modules/*.md` covers six modules today, extend per the promotion gate that already lists Documentation as a criterion), developers (architecture overview, technical specs, API conventions, ADR index), operators (deployment plan, environment configuration per technical spec 11, observability, maintenance runbooks for the backup, cache, and database tools).
- The content already exists; the work is the rendering pipeline and the information architecture, not writing from scratch. D14 decides hosting: an in-app MDX route, versus a separate docs site fed from a separate repo (the maintainer states the documentation lives apart from the open-source source).
- Add the Docs link to nav and footer (UI-38) and surface it in the hero once live.

### Business logic exposure audit

Before more Phase 2 builds, this audit fixes which data may surface for which audience. Basis: a full schema and service inspection done for this plan (enums quoted from `src/db/schema/enums.ts` and the module schema files; enforcement from `src/proxy.ts`, `src/lib/rbac/`, and `docs/technical-specs/12-permission-resolution-flow.md`, the repo's single source of truth for permission resolution).

**The three rings.**

| Ring                                    | Audience                 | Entry mechanism today                                                                                                                                                                  | Data allowed                                                            |
| --------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0 Public                                | anonymous visitor        | server components under `src/app/(public)/**` calling services directly; `/api/**` requires a session except `/api/auth/**` and five anonymous auth endpoints (`src/proxy.ts:100-117`) | rows at an audience-ready lifecycle state, via a public-safe projection |
| 1 Member                                | logged-in user or member | session plus an ownership filter (`userId` is the session user) or a member-tier role; `/dashboard/**` stays closed via `isRoleAllowedForPath` (`src/proxy.ts:46`)                     | ring 0 plus own records plus member-audience content                    |
| **Exposure rules (signed off in D15).** |

Key architectural fact: public and member pages never go through `/api/v1`; they call services from server components. That is how `(public)/events/page.tsx` reads (`listEvents` with visibility PUBLIC) and how the job board reads (`listPublicJobPostings`). Every new frontoffice surface must follow the same pattern: a dedicated public-safe read function per surface. Never loosen API gating, never reuse an admin projection.

**Exposure rules (proposed, sign-off in D15).**

- R1 Audience-ready is a per-module lifecycle state, not a global flag; the matrix below names it per module.
- R2 Public-safe projections are field allow-lists built at the service layer, one per frontoffice surface. The never-public list below must not appear in a ring 0 or 1 response, even by accident.
- R3 Member-scoped reads filter by the session user inside the service, never fetch-all-then-filter in a component.
- R4 Frontoffice writes are limited to: own event registrations, job applications, and profile opt-ins; forum posts and comments (with the moderation queue); membership join and renew; award nominations. All other writes stay in the backoffice.
- R5 Exposure state comes from data (status and visibility columns), never from hand-maintained copy, the UI-25 lesson.

**Never-public fields** (schema inspection):

- `users`: email, emailVerified, passwordHash, emailVerificationToken, role, deletedAt. The admin projection `member/columns.ts` includes email and emailVerified, exactly what a member surface must not reuse.
- Auth internals: accounts, sessions, verification, password_reset_tokens, user_login_activities, active_devices, auth_logs, role_change_history (tokens, ipAddress, userAgent, location).
- Other members' finance: membership_subscriptions, membership_transactions, membership_invoices, membership_payments (amounts, invoiceNumber, providerTxId).
- Applications and nominations: job_applications (coverLetter, resumePath, salaryExpectation), award_nominations (nominee and nominator emails, statement, review status).
- Rosters and tickets: chapter_members and committee_members email and phone, event_registrations qrCode, ticketData, and check-in timestamps, certificates.studentEmail, forum_reports (reason, reporter, resolver).

**Per-module exposure matrix.** Ring is the widest audience allowed; the last column names how the frontoffice presentation differs from the backoffice.

| Module                                    | Lifecycle today                                                                                                                                                                                      | Backoffice keeps                                      | Member gets (ring 1)                                                            | Public gets (ring 0)                                                                    | Presentation shift                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Events                                    | status DRAFT, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, IN_PROGRESS, COMPLETED, CANCELED, POSTPONED; visibility PUBLIC, MEMBERS_ONLY, PREMIUM_MEMBERS, SPECIFIC_ROLES, PRIVATE, INVITE_ONLY | full CRUD, capacity, check-in                         | PUBLIC and MEMBERS_ONLY list and detail, own registrations, register and cancel | list and detail for visibility PUBLIC in audience-ready statuses (exists)               | table and calendar become a card grid; the admin form becomes a registration form; statuses translated for visitors (REGISTRATION_CLOSED shown as "Registration closed") |
| Jobs                                      | status DRAFT, PUBLISHED, ARCHIVED, CLOSED, FILLED, CANCELLED; publishedAt; applicationDeadline                                                                                                       | postings CRUD, reference tables, application pipeline | apply, own applications (the `/api/v1/jobs/applications/mine` pattern exists)   | board: PUBLISHED with deadline not passed (exists, `public-board.ts`)                   | admin table becomes a card grid; the pipeline stays in the backoffice                                                                                                    |
| Content                                   | status DRAFT, PUBLISHED, ARCHIVED, DELETED, SCHEDULED; visibility PUBLIC, MEMBERS_ONLY, PREMIUM_MEMBERS, SPECIFIC_ROLES, PRIVATE; publishedAt                                                        | full editorial CRUD                                   | MEMBERS_ONLY items, announcements feed                                          | `/news`: PUBLISHED, visibility PUBLIC, publishedAt in the past (UI-26)                  | editor becomes a reading view with byline                                                                                                                                |
| Forums                                    | post status DRAFT, PENDING_REVIEW, PUBLISHED, ARCHIVED, DELETED, HIDDEN; categories carry isPrivate and requiredRole                                                                                 | moderation queue, reports, categories                 | read and post where requiredRole allows; report button                          | D8 decides: fully public vs members-only reading; PENDING_REVIEW never leaves the queue | moderation queue becomes a threaded discussion                                                                                                                           |
| Members and profiles                      | users soft-delete via deletedAt                                                                                                                                                                      | full directory with PII                               | own profile and settings                                                        | opt-in directory and profiles under a public-safe projection, no email (D7)             | directory table becomes profile cards                                                                                                                                    |
| Chapters and committees                   | chapters status ACTIVE, INACTIVE, PENDING, SUSPENDED; committees use lowercase text statuses                                                                                                         | CRUD plus roster management                           | own chapter and committee memberships                                           | ACTIVE units with leadership names; roster emails and phones stay private               | org tree becomes unit pages with contact and leadership                                                                                                                  |
| Workspaces                                | ACTIVE, ARCHIVED, LOCKED; collections are jsonb blobs                                                                                                                                                | CRUD                                                  | participants, later                                                             | none, internal collaboration                                                            | stays in the backoffice                                                                                                                                                  |
| Awards                                    | programs DRAFT, OPEN, CLOSED, ARCHIVED with open and close dates                                                                                                                                     | programs, selection                                   | nominate on OPEN programs, own nominations                                      | list of OPEN programs                                                                   | selection table becomes a nomination form                                                                                                                                |
| Learning                                  | courses with level, price, rating; certificates ACTIVE, REVOKED, verificationCode                                                                                                                    | authoring, certificate issuance                       | catalog plus enrollment (needs an enrollments table, UI-35), own certificates   | certificate verification by code (public by nature, replaces the fabricated UI-03 page) | authoring UI becomes course and lesson pages                                                                                                                             |
| Membership tiers                          | isActive, price, billingCycle, features                                                                                                                                                              | tier CRUD                                             | own subscription, renew, payment methods                                        | tier catalog, the pricing page (requires UI-02 to make tiers real first)                | admin modal becomes pricing cards                                                                                                                                        |
| Finance                                   | invoices ISSUED, PAID, VOID; transactions PENDING, COMPLETED, FAILED, CANCELED, REFUNDED, PARTIALLY_REFUNDED                                                                                         | ledger, budget, reports                               | own invoices and payments, pay now (UI-34)                                      | donation page only                                                                      | ledger table becomes a personal statement                                                                                                                                |
| Communications                            | no schema, stub pages only                                                                                                                                                                           | composer and sender after D3 and D11                  | inbox, later                                                                    | none                                                                                    | nothing to build yet                                                                                                                                                     |
| Organization, settings, analytics, system | singleton plus settings                                                                                                                                                                              | everything                                            | none                                                                            | none                                                                                    | stays in the backoffice                                                                                                                                                  |

**Where each ring is enforced.**

- Ring 2: `src/proxy.ts:37-54` (session plus `isRoleAllowedForPath`) for pages; `requirePermission` inside API handlers for data. The finance routes are the consistent example: every handler under `src/app/api/v1/finance/` gates on a `finance:*` permission.
- Ring 1: a session check in the server component or hook, plus the ownership filter in the service; member-tier roles sit at levels 25 to 40 in `docs/technical-specs/09-authentication-and-authorization.md` and are not granted by hand: they sync from `membership_subscriptions` through `deriveRoleFromMemberStatus` (`src/lib/services/membership-status.service.ts:117`, ADR-0014), so ring 1 access follows paid status automatically.
- Ring 0: no gate at all; safety comes entirely from the service filter (status, visibility, deadline) plus the projection. These pages run unauthenticated, so the service function is the security boundary.

**Consequences for this plan.**

- D11 decided: the content module owns announcements; the communications row stays empty until its schema exists, and D3's build-all covers its pages only then; no frontoffice inbox on top of stubs.
- The matrix is the acceptance test for every Phase 2 page: it ships only when it reads through its own public-safe function and renders ring-appropriate fields.
- UI-33 (membership funnel) spans all three rings: catalog (ring 0), checkout plus own subscription (ring 1), tier management (ring 2).
- Demo mode (UI-39) must seed every audience-ready state in the matrix.
- The communications row stays empty until D3 and D11 decide ownership; no frontoffice inbox on top of stubs.

| Module                                        | Schema | Service                         | API             | Backoffice UI               | Member UI                | Public UI       |
| --------------------------------------------- | ------ | ------------------------------- | --------------- | --------------------------- | ------------------------ | --------------- |
| Events                                        | ✓      | ✓                               | ✓               | ✓                           | register/check-in        | ✓ list + detail |
| Jobs                                          | ✓      | ✓ (`public-board.ts`)           | ✓               | ✓                           | apply flow               | ✓ list + detail |
| Content (articles/announcements/publications) | ✓      | ✓                               | ✓               | ✓ full CRUD                 | ✗                        | ✗               |
| Forums (categories/posts/comments/reports)    | ✓      | ✓                               | ✓               | moderation only             | ✗                        | ✗               |
| Members & profiles                            | ✓      | ✓                               | ✓ (admin-gated) | directory only              | own settings only        | ✗               |
| Chapters / Committees / Workspaces            | ✓      | ✓                               | ✓               | ✓                           | ✗                        | ✗               |
| Awards                                        | ✓      | ✓                               | ✓               | ✓                           | ✗ (nav gated out)        | ✗               |
| Learning (courses/certificates)               | ✓      | ✓                               | ✓               | ✓ admin + member catalog    | view-only, no enrollment | ✗               |
| Membership join/renew/apply                   | ✓      | ✓ (subscription/payment/Stripe) | ✓               | tiers/applications/renewals | ✗                        | ✗               |
| Finance (dues/invoices/donations)             | ✓      | ✓                               | ✓               | ✓                           | ✗                        | ✗               |
| Communications (notifications/newsletters)    | ✗      | ✗                               | ✗               | stub pages                  | ✗                        | ✗               |

### UI-26 Public content reading surface: `/news` (HIGH)

- Routes: `/news` paginated list + `/news/[id-or-slug]` detail; published-only.
- Data: add a published-only read path in `src/lib/services/content/queries.ts` modeled on `public-board.ts` (status `PUBLISHED`, `publishedAt <= now`, pagination). Do **not** reuse the `content:read`-gated API handlers for the public page, call the service from a server component.
- Pure read-side work: the backoffice already manages the full lifecycle including schedule/archive (`src/app/dashboard/content/articles/page.tsx:39-43`). D9 decided: one `/news` feed for all three types with filter chips; no separate routes.
- Backoffice article rows should gain a "View public page" link to this URL once it exists.

### UI-27 Forum reading & participation (HIGH)

- Today the forum exists _only as a moderation queue_: posts/comments/categories/reports are fully served by `/api/v1/forums/**`, the member sidebar advertises a Forums section (`src/lib/navigation-data/forums.ts:11-15` includes member roles), yet every child is admin-gated (`:29-44`) and there is no UI anywhere in the app for reading or writing a post.
- Build under `src/app/(public)/forums`: category index (the categories API already returns post stats), per-category thread list, thread detail with comments, session-gated create-post and comment forms (model: the jobs apply form), and a report button wired to `/api/v1/forums/reports`.
- Filter strictly: `PUBLISHED` posts only; honour the per-category role gate (applied by the forum service) and moderation state, `HIDDEN`/`DELETED` content must never render.
- D8 decided: default members-only reading; admins open individual categories to anonymous readers through the existing `isPrivate`/`requiredRole` columns (data-driven, R5); posting always requires an account.

### UI-28 Member directory & public profile (HIGH, D7 decided: opt-in)

- No profile page exists anywhere except the private settings screen (`dashboard/profile`).
- The existing member detail endpoint exposes email/username/verification state under `users:read` (`src/app/api/v1/members/route.ts:14-17`), that shape is admin material and **must not** back a member-visible surface.
- Build `/members` (search + paginated directory) and `/members/[id]` (name, avatar, role, bio, social links, fields already editable via `dashboard/profile/components/social-links-form.tsx`, plus chapter/committee affiliations).
- Requires a new public-profile read path returning only opt-in fields and a visibility toggle in profile settings (schema addition). Privacy-by-default: hidden until the member opts in.

### UI-29 Organization pages: chapters & committees (MEDIUM)

- Full services and APIs exist (`/api/v1/chapters`, `/api/v1/committees`, `/api/v1/workspaces`; chapter membership logic in `src/lib/services/chapter/membership.ts`) but nothing public. Build `/chapters`, `/chapters/[id]`, `/committees/[id]` so the org structure managed in the backoffice is visible to members and visitors; link them from the footer and landing once live.

### UI-30 Linked entities across existing public pages (MEDIUM)

- Event detail should render the organizer (name/avatar) and link to the UI-28 profile; today `organizerId` is data with no destination.
- Job detail: link the company/organization; content articles: byline linking the author profile.
- Small once UI-28 exists; listed separately so the links are not forgotten.

### UI-31 Member home: "my" surfaces (MEDIUM)

- The member dashboard today is the admin dashboard with items filtered out. Build the member-centric views the data already supports: own membership card (status/tier/renewal, `membership-status.service.ts`, `subscription.service.ts`), my event registrations, my job applications (`/api/v1/jobs/applications/mine` exists as the pattern), my posts/comments.

### UI-32 Member communications: announcements & notifications (MEDIUM)

- Announcements have a real backoffice in the content module (`/api/v1/content/announcements`, full CRUD under `dashboard/content/announcements/`) but no member outlet anywhere. Meanwhile a _rival_ communications module is bare stubs, `dashboard/communications/announcements/page.tsx` is literally a single `<h1>`. D11 decided: the content module owns announcements and the communications stub is deleted; communications remains the future home of notifications/newsletters (built real per D3 once its schema exists).
- Build: latest published announcement on the member dashboard; banner on the event pages an announcement targets; a member notification inbox scoped to the announcement feed first (backoffice notifications/newsletters pages are also stubs).

### UI-33 Membership join, renew & apply funnel (CRITICAL for an AMS)

- The highest-value missing flow: nowhere in the app can anyone join, renew, pay, or apply for membership, yet `subscription.service.ts` (full state machine in `lib/services/subscription/state-machine.ts`), `payment.service.ts`, `membership-tier.service.ts`, the Stripe webhook (`app/api/webhooks/stripe/route.ts`) and the `/api/v1/finance/subscriptions` API all exist.
- Build: public `/membership` page with real tiers (requires UI-02's mock tiers to become real first), session-gated join/checkout, renewal + payment-method management from the member home (UI-31), and a membership application form feeding the existing backoffice applications queue (`dashboard/memberships/applications`).
- D10 decided: both tracks. Self-serve Stripe checkout for individual tiers (after the UI-41 webhook fix), plus the application form for corporate/special tiers feeding the backoffice applications queue (built real per D3).
- The nav data already betrays the intent: the Member Directory child lists member roles (`lib/navigation-data/memberships.ts:22-25`) but its parent section is admin-only (`:10`), members were meant to see membership surfaces here.

### UI-34 Member finance: my dues, invoices & donations (HIGH)

- Members cannot pay dues, view their own invoices, or donate, every finance surface is backoffice-only (`invoices-table.tsx`, `donations-table.tsx`) despite `invoice.service.ts`, `payment.service.ts` and `/api/v1/finance/{invoices,payments,dues,donations}` existing.
- Build inside the member home (UI-31): outstanding balance + pay-now, invoice history, and a donation page (public, session optional). Reuse the Stripe wiring from UI-33.

### UI-35 Learning: enrollment & progress (MEDIUM)

- Members can browse the course catalog (`dashboard/learning/courses`) but cannot enroll in or take a course, the page itself says "until enrollment tracking exists" (`learning/courses/page.tsx:44-45`). The learning service has full course/certificate queries + mutations (`lib/services/learning/`), so this is a missing interaction layer, not a missing data layer.
- Build: enroll/unenroll action, my-courses with progress, lesson view. Check `db/schema/learning.ts` for an enrollment table first; if absent, a schema addition is needed, the one Phase 2 item that may require schema work.

### UI-36 Awards: nominations by members (LOW)

- The nominations API exists (`/api/v1/awards/nominations`) and the nav child includes member roles (`lib/navigation-data/awards.ts:31-40`), but the parent section is staff-only (`:10-19`), members can never reach it, the same sidebar divergence as forums (UI-22).
- Build: a member nomination form against open programs; until then, fix the nav gating so it stops advertising unreachable pages.

**Phase 2 acceptance:** every entry in `LIVE_MODULES` resolves to at least one real frontoffice route consuming backoffice data; the member sidebar Forums section lands on a working thread list; `/members/[id]` leaks no email/verification fields (manual + axe check); each public read path filters on published state with a regression test; a member can complete join/renew end-to-end against Stripe test mode; member-visible nav items resolve only to real, member-permitted pages; footer/nav link the new surfaces.

---

## 4. Phase 3: Feedback & interaction quality (P1)

### UI-06 Ban `alert()` / `confirm()`; one feedback idiom (HIGH)

A global Toaster (`src/app/layout.tsx:44`), an `Alert` component, and `AlertDialog` all exist. Call sites to convert:

- `alert()`: `src/app/(public)/events/[id]/page.tsx:32,:35,:54`; `register/page.tsx:61,:64,:68`; `check-in/page.tsx:89`; `certificates/page.tsx:79`; `src/components/dashboard/layout/sidebar-footer.tsx:56,:60`.
- `confirm()`: `src/app/dashboard/content/media/page.tsx`, `content/categories/page.tsx:83-85`.
- Missing confirmation entirely: `events/registrations/page.tsx:226` (UI-05).

Reference: users/roles AlertDialog-with-reason. After conversion, add a lint guard (Phase 8).

### UI-07 Auth & registration flow hardening (HIGH)

- Session gate on `register/page.tsx` with redirect to `/auth/login?redirectTo=...`, copy the jobs apply-form pattern (`src/app/(public)/jobs/[id]/_components/apply-form.tsx`), the best form in the codebase.
- Auth error/success banners: adopt the existing but unused `FormMessage` (`src/components/auth/auth-layout.tsx`) with `role="alert"`; currently server errors are invisible to screen readers (all four pages duplicate inline banners, none with live-region semantics).
- `src/app/(public)/events/[id]/page.tsx:44-55`, handle `navigator.share` rejection; await/catch the clipboard fallback.
- `src/app/auth/callback/page.tsx:234-237`, replace the fake 60% progress bar with an indeterminate spinner.
- Native terms checkbox outside RHF in `src/components/events/event-registration-form.tsx:149-165`: replace with shadcn `Checkbox` in the form state.

### UI-08 Touch targets & unlabeled icon buttons (HIGH)

All `Button` sizes are under the 44px guideline (`src/components/ui/button.tsx:20-27`: h-9/h-8/h-10). Add a `size="touch"` (h-11, 44px) variant used by default on `md:hidden` contexts, following the sidebar's `after:-inset-2` hit-area technique where expansion is preferable.

Icon-only controls missing `aria-label` (app-wide aria-label count is only 52):

- `src/components/events/event-list-layout.tsx:50-52` (back button; also the page title is an `h2` with no `h1`).
- `src/components/events/event-certificate.tsx:131-136` (Verify / View details).
- `src/components/events/event-check-in.tsx:176-181` (search input; also deprecated `onKeyPress` at `:179` and toggle buttons without `aria-pressed`).
- `src/app/(public)/jobs/page.tsx:40-45` and `dashboard-header.tsx:172-203` (placeholder-only search inputs, the desktop dashboard search additionally has no submit handler; wire it to a real search or remove the affordance, and the same for the no-op mobile command-menu button at `:207-210`).

### UI-09 Table & list UX standard (HIGH)

Table UX is the daily-work surface of the backoffice and is currently the weakest part of it. The base primitive is raw shadcn with zero data features (`src/components/ui/table.tsx`), so 20+ tables hand-roll their own sort/pagination/selection, inconsistently. Meanwhile the **services already support server-side pagination everywhere** (`paginate()` in award/chapter/committee/job/learning/workspace queries) that the frontend mostly never asks for. Capability today: content-module tables have selection + expansion but no sortable headers; `invoices-table.tsx` has none of sort/pagination/empty-state; registrations/check-in are silently capped at `limit: 100` (`registrations/page.tsx:63,:77`); users directory at `DIRECTORY_LIMIT=100` (`directory/page.tsx:18,:84`); memberships directory alone uses load-more with grid/list toggle.

**Status (this review).** The maintainer approved the shared layer after its second revision, and the approval notes are resolved. The layer: `src/components/data-table/` (`DataTable`, `DataTableColumnHeader`, `DataTablePagination`, `DataTableSearch`, `DataTableViewOptions`, `DataTableFacetedFilter`, `DataTableBulkBar`), TanStack Table v8 per D12, `aria-sort` on the `th`, skeleton/error/empty states built in, pagination always server-driven through a `pagination` slot owned by the page. The second revision added the pieces the first review flagged as missing: faceted per-column filters with counts (`getFacetedUniqueValues` in the server shape `(columnId) => Map`), controlled selection with a bulk bar and AlertDialog confirmation, a toolbar prop that accepts a render function so pages can wire filters to columns, and `useDataTableState` (`src/hooks/use-data-table-state.ts`) syncing sort, search, facets, page, and perPage to URL searchParams (`?sort=joinedAt.desc`, `?q=`, `?status=ACTIVE`, `?page=2&perPage=20`), verified in the browser end to end including deep links. The dev-only example at `/design/preview` (404 in production) is now a numbered 13-section registry where every section names its production consumers: brand identity, tokens/typography/motion, a members-table demo exercising the exact production API shape (manual flags with page-side filtering, sorting, and facet counts standing in for the server), async states with toasts and `EmptyState` variants, the form standard (UI-16), a primitive gallery, overlays, charts per D5 (`recharts` 3.8.0, shadcn `chart.tsx`, `--chart-1` through `--chart-5`), widgets and stat cards, the backoffice app shell, do-and-don't patterns for color/copy/status/icons, an interactive state matrix, and a table reading real rows from the database through a minimal projection. The approval notes were the maintainer's own theme and font changes (new fonts plus a dark mode switch) which landed mid-review and broke the build and dark mode; the same pass repaired them: compilation restored (`IBM_Plex_Mono` gained its required `weight` option, the body class wires the `--font-sans`/`--font-serif`/`--font-mono` variables for Instrument Sans, Libre Baskerville, and IBM Plex Mono), dark mode restored (the dark palette block is keyed to `:root[data-theme="dark"], [data-theme="dark"]`, matching the ThemeProvider attribute instead of a `.dark` class that next-themes never sets), and both verified in the browser via font-load and dark-toggle checks. Theme selection is now registry-driven per UI-42 (`src/config/themes.ts`). Still open for this item: the per-table remediation below, starting with the migration of `src/components/users/user-table/`.

**A. Shared data-table layer, build once, use everywhere.** A `useDataTableState` hook (sort/page/filters/selection, **synced to URL searchParams**, today everything is local `useState`, so views are lost on navigation and can't be shared/bookmarked) plus composed components: sortable `DataTableHeader` (hover/active arrow affordance, `aria-sort` on the `th` itself), `DataTablePagination` (the `pagination` primitive is missing from `src/components/ui/`, add it; show "Showing X–Y of Z"), `BulkActionBar` (count + confirm-on-destructive, real actions only), `TableSkeleton` (skeleton rows matching column layout), `TableEmptyState` (next action) and `TableErrorState` (retry). **Decision D12:** hand-rolled thin layer (zero deps, fits codebase) vs TanStack Table v8 (battle-tested sorting/filtering/column APIs).

**B. Capability tiers.** Tier A, CRUD admin tables (users, members, invoices, registrations, articles, announcements, publications, media, chapters, committees, roles, award programs/nominations, gateways, dues, donations, budget transactions): sortable headers, server-side pagination, search + filter chips, bulk selection, all four states, row-action menu, URL sync. Tier B, read/monitoring (forum reports, moderation queue, login activity, active devices): sort + pagination + states. Tier C, embedded detail tabs (`[id]` tabs of chapters/committees/workspaces, course tabs): minimum the four states + pagination where the list can grow.

**C. Conventions.** (1) Kill every silent cap, each `limit: 100` either becomes real pagination or states the cap. (2) Row interaction: consistent click-to-open + kebab menu; keyboard Enter must actually work (`user-table.tsx`'s handler is a no-op today); every row icon button gets `aria-label`. (3) Bulk bars expose real actions only, the `logOnlyAction` theater from UI-05 is deleted, not standardized. (4) Data formatting: one date style (absolute + relative in tooltip), money right-aligned with `tabular-nums`, people columns = avatar + name, status badges via the semantic variants from UI-12, truncation with `title`. (5) Density toggle (comfortable/compact) for power users. (6) Mobile: card fallback under `md`, generalize the membership-list grid/list pattern, or sticky first column + horizontal scroll, chosen per tier. (7) a11y: `aria-sort` on `th` (fix `user-table/table-head.tsx` putting it on the Button), labeled select-all ("Select all N"), result counts in a live region. (8) Server-side everything, never client-filter a capped dataset and present it as the full list.

**Remediation (per table):** `invoices-table.tsx`, sort/pagination/empty-state + real download or remove the button + amount validation; `registrations/page.tsx`, pagination + confirm on cancel; `users directory`, pagination past 100, working facets, `aria-sort` placement, live row actions; `articles-table`, add the missing sortable headers (selection/expansion already good, keep as pattern donor); `chapters/committees/workspaces/roles/programs/gateways/dues/donations/budget/media` tables, conform to tiers during the pass; `event-check-in` list, label the search input, replace deprecated `onKeyPress`; `membership-list`, keep the card paradigm, add true pagination as an alternative to load-more.

**Phase 3 acceptance:** `grep -rn "alert(\|confirm("` over `src/` finds zero UI call sites; every icon-only button has an accessible name; registration requires a session; the shared data-table layer exists and every Tier A table uses it; no admin table silently truncates a list.

---

## 5. Phase 4: Accessibility beyond the automated gate (P1)

The axe smoke passes on 18 representative pages; the gaps below are exactly the residual risks that record itself names (dark theme unaudited, one page per module, no screen-reader pass, empty/error states uncovered).

### UI-10 Extend the evidence base

- Run the axe smoke in the dark theme (only light is audited today) and add detail/empty/error pages to the smoke list: an event detail, a forum thread, a job detail, an article detail, and one deliberately-empty list.
- Schedule a screen-reader pass (NVDA/VoiceOver) on the three highest-traffic flows: login > dashboard, public event list > registration, member directory.
- Manual keyboard walkthrough of the finance pages (explicitly not yet performed per the WCAG record).

### UI-11 Fixes the gate cannot catch

- `src/components/users/user-table.tsx:80-81`, `aria-sort` sits on the inner `Button`; move to the `<th>` so sort state is announced.
- Chart a11y: hand-built div bars lack semantics, add `role="progressbar"`/`aria-valuenow` (`analytics-widget.tsx:165-190`, `member-statistics-widget.tsx:191-240`) until the chart primitive lands (D5 decided: adopt shadcn chart (recharts)); use `--chart-*` tokens for all chart color work.
- Skip-to-content link: none exists under `src/app` (WCAG 2.4.1); add one to the root layout targeting `<main>`.
- `src/app/dashboard/finance/reports/page.tsx:183`, convert the known-benign `role="button"` rows to real `<button>`s (tracked warning in the WCAG record).
- Sub-12px text: `text-[10px]` badges are systemic, every `*-overview-cards.tsx` component (chapters:240, committees:216, workspaces:205, finance gateways:96,:259, content articles/announcements/publications overview cards), `navigation-item.tsx:253,:267,:283`, calendar views (`full-calendar/event-group.tsx:32`, `month-view.tsx:77`, `year-view.tsx:42`), forum report badges (`report-list.tsx:117`). Raise to ≥11px and re-check density, or move the information out of badges.
- `bg-red-500 text-white` notification badge (`navigation-item.tsx:283`): use the destructive token.

**Phase 4 acceptance:** axe smoke passes in dark theme on the extended page list; `aria-sort` verified with a screen reader on the users table; skip link present; zero `text-[10px]` outside calendar day-of-week headers (if kept, documented).

---

## 6. Phase 5: Design-system consistency (P2)

### UI-12 Token discipline: stop bypassing the palette (HIGH within phase)

100+ files hardcode Tailwind palette colors that do not adapt to dark mode. Priority sweep order:

1. Status-badge class maps (`*-100/*-800` pairs): `src/app/dashboard/events/_lib/registrations-api.ts:108-114`, awards programs (`awards/programs/page.tsx:58-62`), applicants, jobs listings, memberships directory error state (`red-50/red-200`). Introduce `--success`/`--warning`/`--info` semantic tokens in `globals.css` (only `--destructive` exists today) and standard badge variants.
2. Loading chrome: `src/components/dashboard/loading/dashboard-content-skeleton.tsx:24,:26,:42` (`bg-white dark:bg-gray-800`, `bg-gray-200 dark:bg-gray-700`): use the `Skeleton` primitive.
3. Page-level violations: `jobs/page.tsx:29,:95` (blue/purple gradient + light-only CTA band), `(public)/jobs/[id]/page.tsx:26`, `organization/active-devices/page.tsx:183-184`, `content/media/analytics/page.tsx:74-75`, `member-statistics-widget.tsx` (inline `style={{color:"var(--…)"}}` plus undefined `var(--purple-500)` at `:135,:216` and `bg-purple-100 text-purple-800` at `:143`), events dashboard (`(public)/events/dashboard/page.tsx` purple chips).
4. Dark-mode shadows: the dark block re-declares the full shadow scale at alpha 0.00 (`globals.css:110-123`), so elevation stays invisible in dark; author dark shadows or drop the duplicate. The dark block also re-declares fonts/radius verbatim (`:106-109`), delete ~18 dead lines.
5. Broken token references (HSL-era leftovers): `src/components/dashboard/layout/sidebar-menu.tsx:41` `hsl(var(--sidebar-border))`, `src/app/dashboard/finance/budget/_components/budget-form.tsx:61` `hsl(var(--primary))`, the vars are OKLCH now; use the mapped utilities.

### UI-13 Emoji are not icons (MEDIUM)

Replace with lucide equivalents: `src/components/finance/donations-table.tsx:102-119` (donor-type emoji glyphs used as functional type indicators at `text-xs`), `src/components/memberships/membership-list/helpers.ts:4-11` and `user-directory.tsx:58-66` (emoji glyphs as sort-select option labels), `dashboard-footer.tsx:35` (heart glyph), `email-template/welcome.tsx:56` (celebration glyph; email templates are lower priority). The category emoji field (`content/add-category-form.tsx:152`) is user data, not chrome, acceptable, but pair it with a lucide icon picker.

### UI-14 State primitives: adoption, not invention (MEDIUM)

Primitives exist (`Skeleton`, `LoadingSpinner`, `EmptyState`, `AsyncContent`/`AsyncBoundary`) but ~38 files hand-roll pulse skeletons, ~22 hand-roll spinners, and a duplicate local `EmptyState` exists (`src/app/dashboard/learning/courses/_components/empty-state.tsx`). Sweep module files onto the primitives; delete the duplicate; make `widget-container.tsx:48-54` compose `LoadingSpinner`/`EmptyState` instead of inline versions. Remove the global `.animate-pulse` override (`globals.css:359-361`) which silently re-times every hand-rolled skeleton and collides with Tailwind's utility of the same name; same for `.animate-bounce` (`:369-371`).

### UI-15 Focus idiom consolidation (MEDIUM)

Three competing recipes: the modern shadcn `focus-visible:ring` (buttons/inputs, keep this), legacy `focus:ring-2 focus:ring-offset-2` on dialog/sheet close buttons (`dialog.tsx:64`, `sheet.tsx:69`) and `dark-mode-toggle.tsx`, and the global `:focus-visible` outline + universal `outline-ring/50` base (`globals.css:208-211,:505-507`) plus a `.focus-ring:focus` utility that uses `:focus` not `:focus-visible` (`:494-501`). Converge on the shadcn focus-visible recipe; delete `.focus-ring`.

### UI-16 Form UX and layout standard (HIGH within phase)

Forms are the second weakest daily-work surface after tables, and the tooling excuse does not exist: react-hook-form 7.83, zod 4.4.3 and `@hookform/resolvers` are installed, and the complete shadcn wrapper (`ui/form.tsx` with `aria-describedby`/`aria-invalid` wiring) exists. Three competing patterns coexist instead. (1) RHF + zod + the shadcn wrapper, used correctly only by the learning course forms (`learning/admin/_components/course-form/basic-info-section.tsx`, `module-item.tsx`): this is the reference. (2) RHF + zod + raw `Label` + hand-written error `<p>` tags: `event-registration-form.tsx:139-141` renders errors no screen reader associates with the field. (3) Bare `useState` with zero validation: `budget-form.tsx:74-79` submits whatever the state holds and closes the dialog immediately; the jobs form sections (`jobs/_components/job-form/*-section.tsx`) pass raw state around the same way.

**A. Wiring standard.** Every form uses RHF + `zodResolver` with its schema in `lib/validation/` (pattern: `event.validation.ts`), and renders fields through `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormDescription`/`FormMessage` so ids and ARIA association come for free. Error copy lives in the zod schema as the single source.

**B. Layout conventions.** Visible labels above inputs; placeholders show examples, they never replace labels. Short forms sit in one column with a max-width; related field pairs use `grid md:grid-cols-2 gap-4` (the course-form pattern); long forms split into titled sections (`Card` + `CardHeader`) with `FormDescription` help text. Dialog forms keep the submit in `DialogFooter` and never close on an invalid submit. Everything collapses to one column below `md`, and inputs keep the h-10 touch height (UI-08). Inline `style` colors have no place in forms: `event-registration-form.tsx:66-70,:151-160` styles labels and a raw checkbox by hand instead of using tokens and the `Checkbox` component.

**C. Interaction conventions.** Validate on blur and on submit; move focus to the first invalid field. Submit buttons show a spinner with the label preserved and block double-submit; failures surface as `FormMessage` or toast, per UI-06. Public forms set `autocomplete` (name/email/organization) and reuse the session-gate pattern of the jobs apply form. Native `<select>` and `<input type="checkbox">` controls get replaced with shadcn `Select`/`Checkbox`/`Switch`, including `events/create/page.tsx` (raw controls plus deprecated `onKeyPress`) and the terms checkbox in `event-registration-form.tsx:147-156`. Long page forms (event create/edit, course form) gain an unsaved-changes confirmation before discard.

**Remediation:** `budget-form.tsx` gains a zod schema and stops closing on invalid submit; `event-registration-form.tsx` migrates to the wrapper; the jobs form sections render through `FormItem` inside a shared `Form` provider; `content/add-announcement-form/` (already on `UseFormReturn` with `setValue`) gets verified against the wrapper during the sweep; auth forms land through UI-07.

### UI-17 Motion standard, repo-wide (MEDIUM)

The landing contract (`globals.css:519-567`) is the standard; extend it:

- Auth animejs entrances (`login:93`, `signup:91`, `forgot-password:75`, `reset-password:93`, `callback:63/112/161`) run 1000ms translateY with zero reduced-motion checks. Replace with the CSS `landing-rise`-style pattern, PRM-gated.
- Delete dead motion code: `src/app/auth/layout.tsx` (unattached `backgroundRef`, queries nonexistent `.shape` elements, orphan JSX with hardcoded `bg-[#f8fafc]`, misnamed `ForgotPasswordLayout`); `reset-password/page.tsx:93` animates `.reset-password-card` which matches nothing; dead CSS classes `.animate-shimmer`, `.animate-slideInRight/Left`, `.button-scale`, `.modal-content/-overlay`, `.modal-enter/-exit*`, `.stagger-item*`, `.badge-glow`, `.skeleton` (name-collides with the component).
- Gate `.animate-fadeInUp` (~12 dashboard pages) under reduced motion or replace with the landing pattern; gate `html { scroll-behavior: smooth }` (`globals.css:248-250`) under `@media (prefers-reduced-motion: no-preference)`; gate `button.tsx:8` `active:scale-[0.97]` with `motion-safe:`; `.card-hover` uses `transition: all` (`globals.css:383`): use explicit properties.
- Add duration tokens (`--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-drawer: 300ms`) beside the existing `--ease-*` tokens; components currently hardcode durations.
- Doc drift: `plans/README.md` lists plans 001–006 as TODO though 001–005 are verifiably implemented (`--ease-drawer` in globals, explicit button transitions, hero stagger, hover gating, scroll reveals). Mark DONE and refresh the stale `src/app/page.tsx` line references to `src/app/_components/`.

### UI-18 Dependency hygiene (LOW)

`package.json` carries 18 individual `@radix-ui/*` packages _and_ unified `radix-ui@1.6.7`; only `badge.tsx:3` imports the unified one. D6 decided: migrate all imports to the unified `radix-ui@1.6.7` package and remove the 18 individual ones in a single deliberate commit per the dependency policy. `loading-skeleton.tsx`: convert the default export to named, for consistency.

### UI-42 User-selectable themes: registry prepared (READY)

The maintainer wants the theme system ready for additional themes that users can pick directly. The mechanism already exists: next-themes 0.4.6 writes the active theme id as the `data-theme` attribute on `<html>` (the ThemeProvider in `src/app/layout.tsx` uses that attribute), and each palette is a selector-scoped block in `src/app/globals.css`. What is prepared is the single extension point: `src/config/themes.ts` registers every selectable theme (`APP_THEMES`, currently `light` and `dark`) and feeds the ThemeProvider `themes` prop, the header `DarkModeToggle` (fast flip between the primary light and dark theme), the dashboard preferences theme cards, the quick-settings menu radio group, and the sonner toaster light/dark mapping (`isDarkTheme`). Adding a theme takes exactly two steps, both documented in the registry: register an entry, and add a `:root[data-theme="<id>"], [data-theme="<id>"]` palette block overriding every token. If the new theme is dark, its selector also joins the `@custom-variant dark` line in `globals.css` so `dark:` utilities resolve inside it. Selection persists through next-themes localStorage; syncing the choice to a per-user preference row so it follows the account across devices is deliberately a follow-up.

**Phase 5 acceptance:** zero emoji in functional UI chrome; zero `bg-white`/`gray-*` in loading skeletons; every form submits through RHF + zod with errors rendered by `FormMessage`; `bunx oxlint` + axe smoke still green in both themes; dark shadows visibly distinct from flat.

---

## 7. Phase 6: Performance & architecture (P2/P3)

### UI-19 Server-first correction pass (HIGH within phase)

314/497 TSX files are `"use client"` against ADR-0006's server-first rule. Do not attempt a big-bang rewrite; convert by value:

1. The 19 bare-`<h1>` stub pages (settings tabs, tools, analytics children, `users/security`, memberships analytics/applications/renewals, events pricing/certificates), trivially server components; also decide their fate (UI-23).
2. Read-only detail pages currently fetching client-side (`(public)/events/[id]` shell, article detail, forum thread): convert to RSC + server actions for mutations.
3. `settings/general/page.tsx` (server component + permission gate) is the reference pattern.

### UI-20 Route-level states (HIGH within phase)

- Add `src/app/global-error.tsx` and route-segment `error.tsx` for `(public)`, `auth`, and `dashboard`, none exist anywhere today.
- Add `loading.tsx` beside heavy list routes (public events, jobs, dashboard module lists), exactly one exists today (`dashboard/loading.tsx`).
- Remove the artificial 100ms header skeleton delay (`src/app/dashboard/layout.tsx:53-60`) and the dead layout props (`:17-40`); delete dead `loading-boundary.tsx` and `page-transition.tsx` (imported by nothing).

### UI-21 Images & metadata (MEDIUM)

- Replace raw `<img>` with `next/image` or the `Avatar` primitive: `src/components/dashboard/layout/sidebar-dashboard.tsx:61` (add OAuth avatar hosts to `next.config.ts:44-52` `remotePatterns` rather than bypassing), `src/app/dashboard/learning/courses/[courseId]/page.tsx:169`.
- Auth logo overflow: 60px image in a 48px container without `overflow-hidden` (`auth-layout.tsx:43-48`, `forgot-password/page.tsx:98-103`, `callback/page.tsx:215-216`).
- `Event.coverImage` renders a dead branch, no schema column exists (`src/db/schema/events.ts`); wire to the media service or delete the branch (`event-card.tsx:175-185`).
- Root layout: add `export const viewport` (theme-color), openGraph metadata, and an `opengraph-image`.

**Phase 6 acceptance:** client-component share below 50%; every route group has an error boundary; Lighthouse CLS < 0.1 on landing/events/jobs/auth.

---

## 8. Phase 7: Navigation & IA (P3)

### UI-22 Sidebar & shell correctness (MEDIUM)

- Sidebar role filtering checks only top-level items (`dashboard-sidebar.tsx:62-64`) while the server gate flattens children (`src/lib/dashboard-access.ts:19-33`), a member can _reach_ `/dashboard/events/calendar` but never _see_ the Events section. Filter children too, using the same flattened source as the gate.
- Parent and child nav entries diverge on role lists: `events/calendar` and `memberships/directory` add member roles, `finance/budget` adds chapter roles while dropping staff, `organization/workspaces` and `organization/budget` add roles absent from their parents, `content/announcements` adds chapter roles while dropping moderator (`src/lib/navigation-data/*.ts`). Longest-path-first matching means a member denied the parent URL can still reach the child directly. After the sidebar filter fix, enumerate every divergence explicitly and add a nav-manifest test asserting any new parent/child role delta is a deliberate edit to that list.
- `user?.role as UserRole` while the session is pending drops every role-gated item, render a sidebar skeleton instead.
- `navigation-group.tsx:53-56` hardcodes `main` + `admin` categories, silently discarding `personal` items; dedupe the `member-analytics` id (`navigation-data/analytics.ts:13` vs `memberships.ts:48`).
- Two sidebar-state stores (cookie in `src/components/ui/sidebar/` vs localStorage `sidebarCollapsed` in `DashboardProvider`), keep the cookie, delete the context copy; also delete the dead theme slice in `dashboard-context.tsx` (`:36,:116-120,:163,:179,:196`, uses deprecated `substr`).
- `forum-layout.tsx:41-46` calls `setHeader` without `clearHeader` cleanup, the forums title leaks onto subsequent stub pages; copy the cleanup pattern from `users/directory/page.tsx:62-72`.

### UI-23 Stub pages: build every one real (MEDIUM, D3 decided)

Nineteen bare-`<h1>` pages are reachable from nav/settings tabs: `events/pricing`, `events/certificates`, `users/security`, `memberships/{analytics,applications,renewals}`, `analytics/{content,custom,events,members,financial}` (there is no `analytics/page.tsx` root, the section lands nowhere), `settings/{email,oauth,payments,security}`, `tools/{backup,cache,database,logs}`. D3 decided: build every one of them real. Dependencies: D5 charts for the five analytics pages, UI-02 real tiers for `events/pricing`, D2 for `events/certificates`, auth plumbing for the settings tabs; `tools/*` stays superadmin-only and is gated in the demo sandbox (D13). Do not ship empty pages behind real navigation.

### UI-24 Public events product gaps (MEDIUM)

- Public list silently capped at 20 (`(public)/events/page.tsx:21`, via service default `limit: 20`, `event-read.service.ts:49,:167`; `totalPages` is computed but unused). Add pagination.
- The accessible `EventFilter` component (search/status/type/date/format/tags) is wired only into the admin list, expose it publicly.
- Registration-state loss: DB `REGISTRATION_OPEN/CLOSED/IN_PROGRESS` collapse to UI `published` (`src/lib/utils/event-utils.ts`), so "Register Now" stays enabled for closed events (`event-layout.tsx:99`). Propagate the registration window instead.
- "Similar Events" card is placeholder copy although the read service already computes similar events (`event-read.service.ts:255-271`), consume it.
- Member "Check In" quick action (`events/[id]/page.tsx`) targets a route gated by `events:manage`, members bounce to the admin check-in. D4 decided: build QR-based self-check-in using the `qrCode` field already stored on `event_registrations` (never-public, suitable as the credential), session-scoped with a time window around the event; staff check-in stays on `events:manage`.
- `event-layout.tsx:45` `router.back()` leaves the site for deep-linked visitors; fall back to `/events`.

### UI-25 Landing copy vs reality (MEDIUM)

`TODO.md:143-145` records all eleven modules Promoted, but the landing still claims five: `hero-section.tsx:49-50`, `modules-section.tsx:18`, `landing-data.ts:32,:35` (Finance/Chapters/Committees listed as upcoming), `site-footer.tsx:22`. For a product whose pitch is an honest roadmap, derive `LIVE_MODULES` from `config/features.ts` maturity flags instead of hand-editing copy.

**Phase 7 acceptance:** sidebar visibility matches server reachability for every role; every nav item lands on a real page; public events list paginates; landing module count matches `config/features.ts`.

---

## 9. Phase 8: Guardrails: make the fixes stick

1. **Lint guards** (oxlint, per ADR-0013 toolchain): ban `alert`/`confirm`/`prompt` in `src/app` and `src/components`; add `no-restricted-syntax`-style checks for `opacity: "0.1"`-style inline opacity on status banners if expressible; keep jsx-a11y at error level.
2. **Extend the a11y smoke**: dark-theme run + detail/empty-state pages (Phase 4); add to CI alongside the existing gate. New Phase 2 pages join the smoke list as they land.
3. **Mock labeling**: any page rendering static data must either sit behind `MODULE_FLAGS=false` with `ModulePreviewBanner` (currently inert because all flags are `true` and the flag list omits users/analytics/settings/tools, `config/features.ts`) or carry an explicit preview badge. Add a test asserting banner renders when a flag is false.
4. **Frontoffice coverage guard**: a route-manifest test asserting every `LIVE_MODULES` entry resolves to at least one real frontoffice route; keep the Phase 2 coverage matrix updated whenever a module is promoted.
5. **Docs**: log any out-of-scope bug found during execution in `TODO.md` per CLAUDE.md; update `plans/README.md` statuses (UI-17); re-verify claim-gap map row 1 after Phase 1; fold this plan's open items into `TODO.md`'s good-first-issue list where sized appropriately (the dead-nav-links and calendar-`weeks`-key items at `TODO.md:184,:188` overlap UI-22/UI-14).
6. **Copy style guard**: no emoji glyphs and no em-dashes in UI chrome or in `docs/planning/**`. A `guard:light` grep for U+2014 and the emoji ranges keeps this plan and future docs clean; UI emoji removal stays tracked under UI-13 until the sweep lands.
7. **Route boot smoke**: extend `test:integration` (or a sibling script) to start the app and request the primary routes plus every nav-manifest route, asserting rendered responses and zero 500s. The UI-37 barrel error passed typecheck and lint because neither renders a page; a 200/3xx smoke is the minimum proof the app boots.
8. **Middleware-path auth tests**: route-auth coverage must exercise requests through the middleware, not handler calls that bypass it. The UI-41 webhook gap passed both existing tests: one bypassed the middleware, the other regex-matches source text and accepted a docblock mention of `requirePermission`.
9. **Permission spec sync**: technical spec 09 §9.4 lists 12 permission modules, code defines 16 (adds chapters, committees, awards, workspaces, `src/types/role/permission-types.ts:2`). Update the spec table and add a test comparing `PERMISSION_MODULES` against the spec so the two cannot drift again.

---

## 10. Decisions (resolved in maintainer review)

All fifteen decisions were resolved in the review session accompanying this plan. Item headings above that once said "needs decision" now carry the resolution.

| #   | Decision                     | Resolution                                                                                                                                                                                                     |
| --- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Overview widgets             | Build real aggregates for every widget now, including trend and finance aggregates; delete the fakers and fake polling (UI-01).                                                                                |
| D2  | Certificates page            | Build the real verification flow: member's own ACTIVE certificates plus public verification at `/certificates/verify/[code]` via the existing `verificationCode`; take the fabricated page down first (UI-03). |
| D3  | Nineteen stub pages          | Build every one of them real; dependencies named in UI-23 (D5 charts, UI-02 tiers, D2 certificates, settings plumbing); `tools/*` superadmin-only and gated in the demo sandbox.                               |
| D4  | Member self check-in         | Build QR-based self-check-in on the existing `qrCode` field, session-scoped with a time window; staff check-in stays on `events:manage` (UI-24).                                                               |
| D5  | Chart strategy               | Adopt shadcn chart (recharts) themed with the existing `--chart-*` tokens; hand-built div bars are a stopgap only (UI-11).                                                                                     |
| D6  | Radix dependency direction   | Migrate all imports to unified `radix-ui@1.6.7` and remove the 18 individual packages in one deliberate commit (UI-18).                                                                                        |
| D7  | Public profile privacy model | Opt-in, default private; visible fields displayName, avatar, bio, external links, chapter/committee affiliations; email never public (UI-28).                                                                  |
| D8  | Forum audience               | Hybrid per category: default members-only reading; admins open categories to anonymous readers through `isPrivate`/`requiredRole`; posting always requires an account (UI-27).                                 |
| D9  | Content URL structure        | One `/news` feed for all content types with filter chips (Articles/Announcements/Publications), detail at `/news/[id-or-slug]` (UI-26).                                                                        |
| D10 | Membership funnel scope      | Both tracks: self-serve Stripe checkout for individual tiers after the UI-41 webhook fix, plus an application flow for corporate/special tiers feeding the backoffice queue (UI-33).                           |
| D11 | Announcements ownership      | The content module owns announcements; the communications stub is deleted; communications remains the future home of notifications and newsletters (UI-32).                                                    |
| D12 | Data-table layer             | TanStack Table v8 headless under shadcn styling and design tokens (UI-09).                                                                                                                                     |
| D13 | Demo mode mechanics          | Stages 1+2+3: demo seed, demo member account CTA, and sandbox backoffice with nightly reset and gated sensitive tools; built incrementally, stage 1 first (UI-39).                                             |
| D14 | Docs hosting                 | Source of truth in a separate docs repo; the app renders it in-app at `/docs` at build time (UI-40).                                                                                                           |
| D15 | Exposure matrix exceptions   | Confirmed as proposed: public certificate verification by code, chapter and committee leadership names public while rosters stay private, workspaces fully backoffice-only.                                    |

## 11. Suggested execution order

1. **Phase 1** (trust), everything else is cosmetic while admins see fabricated numbers. Items UI-01…UI-05, parallelizable per module.
2. **Phase 2** (coverage builds), the biggest product gap: promoted modules with no frontoffice. D7–D15 are resolved (section 10); UI-26 (content reading) can start immediately as pure read-side work, and UI-33 (membership funnel) is the single highest-value build for an AMS once the UI-41 webhook fix lands. UI-09's shared table layer (D12) can also start now and compounds every later build. The exposure audit matrix at the top of Phase 2 is the acceptance test for every page built there; UI-39 stage 1 (demo seed) also starts immediately, and UI-40 (docs portal) starts now that D14 is decided, because the landing's promotion purpose depends on both.
3. **Phase 3** (feedback), small, high-feel, low-risk; UI-06 is a good first batch of mechanical commits.
4. **Phase 4** (a11y evidence), extends the M4 WCAG commitment; run alongside Phases 2–3.
5. **Phase 5** (design system), sweep by token family, one commit per concern per the commit policy.
6. **Phase 6** (performance), convert pages opportunistically as earlier phases touch them; build Phase 2 pages as server components from day one.
7. **Phase 7** (IA), D1–D4 resolved (section 10); stub pages are built real per D3.
8. **Phase 8** (guardrails), land each guardrail immediately after its phase, not at the end.

Every phase ends with the existing gates green: `bun run guard:light` minimum; `test:a11y` for anything touching enabled-module pages.
