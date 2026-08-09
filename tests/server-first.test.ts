/**
 * UI-19 guard (docs/planning/03-frontend-improvement-plan.md): the app is
 * server-first — fewer than half of the `.tsx` files under `src/` may carry a
 * `"use client"` directive. Client components stay the exception for real
 * interactivity (hooks, event handlers); presentational components render on
 * the server.
 *
 * The count mirrors the acceptance measure command exactly:
 * `grep -rl '^"use client"' src --include='*.tsx' | wc -l` over the total
 * number of `.tsx` files under `src/`. Both numbers come from real file reads.
 */
import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const SRC_DIR = join(ROOT, "src");

/** A line-anchored `"use client"` match, same as `grep '^"use client"'`. */
const CLIENT_DIRECTIVE = /^"use client"/;

async function countTsxFiles(): Promise<{ total: number; client: number }> {
  const glob = new Glob("**/*.tsx");
  let total = 0;
  let client = 0;
  for await (const file of glob.scan(SRC_DIR)) {
    total += 1;
    const source = await Bun.file(join(SRC_DIR, file)).text();
    if (source.split("\n").some((line) => CLIENT_DIRECTIVE.test(line))) {
      client += 1;
    }
  }
  return { total, client };
}

describe("UI-19: server-first ratio (client components < 50% of tsx)", () => {
  test("fewer than half of src/**/*.tsx files are client components", async () => {
    const { total, client } = await countTsxFiles();
    expect(total).toBeGreaterThan(0);
    expect(client).toBeGreaterThan(0);
    expect(client / total).toBeLessThan(0.5);
  });
});

// ── UI-19 item 2 (event detail): server-resolved source of truth ────────
// The public event detail page resolves the event once in the server
// wrapper (page.tsx) and hands it to the client body, which renders it and
// never re-fetches via useEvent. Append-only: do not edit tests above.

const EVENT_DETAIL_PAGE = join(ROOT, "src", "app", "(public)", "events", "[id]", "page.tsx");
const EVENT_DETAIL_CLIENT = join(
  ROOT,
  "src",
  "app",
  "(public)",
  "events",
  "[id]",
  "_components",
  "event-detail-client.tsx",
);

describe("UI-19 item 2: event detail is server-resolved, no client re-fetch", () => {
  test("page.tsx and event-detail-client.tsx exist", async () => {
    expect(await Bun.file(EVENT_DETAIL_PAGE).exists()).toBe(true);
    expect(await Bun.file(EVENT_DETAIL_CLIENT).exists()).toBe(true);
  });

  test("page.tsx resolves the detail server-side and passes it down", async () => {
    const source = await Bun.file(EVENT_DETAIL_PAGE).text();
    expect(source).toContain("await getEventDetail(");
    expect(source).toContain("detail={detail}");
  });

  test("client body does not re-fetch the detail client-side", async () => {
    const source = await Bun.file(EVENT_DETAIL_CLIENT).text();
    expect(source).not.toContain("useEvent(");
    expect(source).not.toContain("use-events");
    expect(source).not.toContain("useParams(");
  });

  test("client body receives EventDetailData | null and renders not-found for null", async () => {
    const source = await Bun.file(EVENT_DETAIL_CLIENT).text();
    expect(source).toContain("export interface EventDetailData");
    expect(source).toContain("detail: EventDetailData | null;");
    expect(source).toContain("Event Not Found");
  });

  test("cancel flow calls the service, then router.refresh() instead of refetch()", async () => {
    const source = await Bun.file(EVENT_DETAIL_CLIENT).text();
    expect(source).toContain("cancelEventRegistration(");
    expect(source).toContain("router.refresh()");
    expect(source).not.toContain("refetch()");
  });

  test("client keeps register/share/edit interactivity and the real-id organizer gate", async () => {
    const source = await Bun.file(EVENT_DETAIL_CLIENT).text();
    expect(source).toContain("onRegister=");
    expect(source).toContain("onShare=");
    expect(source).toContain("onEdit=");
    expect(source).toContain("event.organizerId === currentUserId");
  });
});

// ── UI-19 item 1: the 18 bare-h1 dashboard stubs are server components ───
// These are placeholder pages (rebuilt real in Phase 7 / UI-23). They carry no
// hooks or handlers, so they must not be client components. `memberships/applications`
// is deliberately excluded — it is the real applications page (UI-33/D10).
const STUB_PAGES = [
  "src/app/dashboard/events/pricing/page.tsx",
  "src/app/dashboard/events/certificates/page.tsx",
  "src/app/dashboard/users/security/page.tsx",
  "src/app/dashboard/memberships/analytics/page.tsx",
  "src/app/dashboard/memberships/renewals/page.tsx",
  "src/app/dashboard/analytics/content/page.tsx",
  "src/app/dashboard/analytics/custom/page.tsx",
  "src/app/dashboard/analytics/events/page.tsx",
  "src/app/dashboard/analytics/members/page.tsx",
  "src/app/dashboard/analytics/financial/page.tsx",
  "src/app/dashboard/settings/email/page.tsx",
  "src/app/dashboard/settings/oauth/page.tsx",
  "src/app/dashboard/settings/payments/page.tsx",
  "src/app/dashboard/settings/security/page.tsx",
  "src/app/dashboard/tools/backup/page.tsx",
  "src/app/dashboard/tools/cache/page.tsx",
  "src/app/dashboard/tools/database/page.tsx",
  "src/app/dashboard/tools/logs/page.tsx",
];

describe("UI-19 item 1: bare-h1 dashboard stubs are server components", () => {
  test("covers exactly 18 stub paths", () => {
    expect(STUB_PAGES).toHaveLength(18);
  });

  for (const rel of STUB_PAGES) {
    test(`${rel} is a hook-free server component`, async () => {
      const file = Bun.file(join(ROOT, rel));
      expect(await file.exists()).toBe(true);
      const source = await file.text();
      // No client directive anywhere in the file.
      expect(source).not.toContain('"use client"');
      expect(source).not.toContain("'use client'");
      // No hooks or handlers that would require a client boundary.
      expect(source).not.toMatch(/use[A-Z][a-zA-Z]*\(/);
      expect(source).not.toMatch(/on[A-Z][a-zA-Z]*=/);
    });
  }
});
