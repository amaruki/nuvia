/**
 * WCAG 2.2 AA axe smoke gate for the enabled modules (backlog item E1,
 * docs/adr/0008-module-maturity-gate.md).
 *
 * Run with: bun run test:a11y
 *
 * What it does, self-contained and idempotent:
 *   1. Boots the test Postgres/Redis stack (compose.test.yml) if not up,
 *      applies the migrations (drizzle-kit migrate) and seeds the admin
 *      accounts with a fresh per-run password (SEED_ADMIN_PASSWORD).
 *   2. Boots the audited server on a dedicated port (default 3111, override
 *      with A11Y_SMOKE_PORT) unless something already answers there — in CI
 *      that is `next start` against the production build (no JIT compiler
 *      workers to saturate the runner); locally it is `next dev`. A server
 *      the gate spawned is killed on exit; a pre-existing one is left alone.
 *   3. Signs in as the seeded superadmin via the better-auth email endpoint
 *      (session cookie lands in the Playwright context automatically).
 *   4. Runs @axe-core/playwright against ONE representative authenticated
 *      page per enabled module (finance — promoted in backlog C5 — is
 *      covered on all six of its dashboard pages) plus the public /events
 *      and /jobs pages.
 *      critical/serious violations fail the run; moderate/minor are
 *      report-only. Raw axe results are written to a unique /tmp directory.
 *
 * No test runner, no new dependencies (playwright + @axe-core/playwright are
 * already devDependencies for this gate).
 *
 * The implementation lives in scripts/a11y-smoke/ (config, helpers,
 * infrastructure, dev-server, audit, main); this file is the thin entry
 * point that package.json's `test:a11y` script runs.
 */

import { main } from "./a11y-smoke/main";

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[a11y-smoke]", error instanceof Error ? error.message : error);
    process.exit(1);
  });
