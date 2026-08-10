/**
 * Phase 8 guardrail item 4 — frontoffice coverage guard
 * (docs/planning/03-frontend-improvement-plan.md §9 item 4; Phase 2
 * acceptance in the same document).
 *
 * The landing claims live status for every module whose maturity flag is on
 * (LIVE_MODULES derives from config/features.ts, decision R5). This guard
 * pins the other half of that honesty: every LIVE_MODULES entry must
 * resolve to at least one real route where the module's data is consumed,
 * so a promoted module can never again be advertised as live while its
 * surface is missing — the Phase 2 gap this plan exists to close.
 *
 * A "real route" is a directory on disk containing a Next.js page.tsx
 * somewhere under it; the manifest below maps every registry module to the
 * route directories that serve it. Nine of the eleven modules serve their
 * frontoffice under src/app/(public)/, per the exposure matrix (plan §3):
 *
 *   members    -> (public)/members        member directory + profiles (D7)
 *   events     -> (public)/events         public list, detail, registration
 *   content    -> (public)/news           reading surface for published content (UI-26, D9)
 *   forums     -> (public)/forums         categories, threads, posts (UI-27, D8)
 *   jobs       -> (public)/jobs           public board (public-board.ts)
 *   finance    -> (public)/donate         donation page, finance/member-donations service
 *               -> (public)/membership    tier catalog + join funnel: dues billing is the
 *                                          finance module (docs/modules/finance.md, UI-33)
 *   learning   -> (public)/certificates   member certificates + public verification by
 *                                          code (UI-03, D2)
 *   chapters   -> (public)/chapters       public unit pages (UI-29)
 *   committees -> (public)/committees     public unit pages (UI-29)
 *
 * Two modules carry documented exceptions, both fixed by maintainer
 * decisions in plan §10 and pinned by name below so no future module can
 * inherit an exception silently:
 *
 *   awards     -> dashboard/awards/nominate — the member (ring-1)
 *                 nomination surface (UI-36). It is the only ring-1
 *                 surface mounted inside the dashboard tree instead of
 *                 under (public)/; the matrix's ring-0 "list of OPEN
 *                 programs" was never built, so this is the module's only
 *                 non-backoffice route.
 *   workspaces -> dashboard/organization/workspaces — decision D15 made
 *                 workspaces fully backoffice-only ("none, internal
 *                 collaboration; stays in the backoffice"). The guard
 *                 still pins its one real route so the landing's live
 *                 claim always resolves to something on disk.
 *
 * Deleting any mapped directory makes this file fail — that is the point.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MODULE_LABELS, MODULE_NAMES, type ModuleName } from "../config/features";
import {
  LIVE_MODULES,
  REGISTRY_MODULE_COUNT,
  ROADMAP_MODULES,
} from "../src/app/_components/landing-data";

const ROOT = join(import.meta.dir, "..");
const APP_DIR = join(ROOT, "src", "app");

/**
 * Route manifest: every registry module mapped to the route directories
 * (relative to src/app) that serve it. Each entry must exist on disk with a
 * page.tsx under it — see the file header for the per-module rationale.
 */
const MODULE_ROUTE_DIRS: Record<ModuleName, readonly string[]> = {
  members: ["(public)/members"],
  events: ["(public)/events"],
  content: ["(public)/news"],
  forums: ["(public)/forums"],
  jobs: ["(public)/jobs"],
  finance: ["(public)/donate", "(public)/membership"],
  learning: ["(public)/certificates"],
  chapters: ["(public)/chapters"],
  committees: ["(public)/committees"],
  awards: ["dashboard/awards/nominate"],
  workspaces: ["dashboard/organization/workspaces"],
};

/**
 * Modules whose serving route intentionally sits outside (public)/, fixed
 * by UI-36 (awards) and decision D15 (workspaces). Pinned exactly: a new
 * module must either land a (public)/ route or amend this list with a
 * decision citation.
 */
const NON_PUBLIC_EXCEPTIONS: readonly ModuleName[] = ["awards", "workspaces"];

/** True when the directory exists and a page.tsx lives somewhere under it. */
function hasRoutePage(dir: string): boolean {
  if (!existsSync(dir)) {
    return false;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && hasRoutePage(full)) {
      return true;
    }
    if (entry.isFile() && entry.name === "page.tsx") {
      return true;
    }
  }
  return false;
}

const LABEL_TO_MODULE = new Map<string, ModuleName>(
  MODULE_NAMES.map((name) => [MODULE_LABELS[name], name]),
);

describe("route manifest shape", () => {
  test("the manifest covers every registry module, no more and no fewer", () => {
    expect(Object.keys(MODULE_ROUTE_DIRS).sort()).toEqual([...MODULE_NAMES].sort());
    for (const module of MODULE_NAMES) {
      expect(MODULE_ROUTE_DIRS[module].length).toBeGreaterThanOrEqual(1);
    }
  });

  test("module labels resolve uniquely (LIVE_MODULES entries are addressable)", () => {
    expect(LABEL_TO_MODULE.size).toBe(MODULE_NAMES.length);
    expect(new Set(LIVE_MODULES).size).toBe(LIVE_MODULES.length);
    for (const label of LIVE_MODULES) {
      expect(LABEL_TO_MODULE.has(label), `unknown live module label: ${label}`).toBe(true);
    }
  });

  test("every non-excepted module is served under src/app/(public)/", () => {
    for (const module of MODULE_NAMES) {
      if (NON_PUBLIC_EXCEPTIONS.includes(module)) {
        continue;
      }
      for (const dir of MODULE_ROUTE_DIRS[module]) {
        expect(dir.startsWith("(public)/"), `${module} route ${dir} escaped (public)/`).toBe(true);
      }
    }
    expect([...NON_PUBLIC_EXCEPTIONS].sort()).toEqual(["awards", "workspaces"]);
  });
});

describe("every live module resolves to at least one real route (coverage guard)", () => {
  test("every manifest entry exists on disk and serves a page", () => {
    for (const module of MODULE_NAMES) {
      for (const dir of MODULE_ROUTE_DIRS[module]) {
        const abs = join(APP_DIR, dir);
        expect(existsSync(abs), `missing route directory for ${module}: ${dir}`).toBe(true);
        expect(hasRoutePage(abs), `no page.tsx under ${dir} (${module})`).toBe(true);
      }
    }
  });

  test("every LIVE_MODULES entry resolves to at least one real route", () => {
    for (const label of LIVE_MODULES) {
      const module = LABEL_TO_MODULE.get(label);
      expect(module, `LIVE_MODULES label not in the registry: ${label}`).toBeDefined();
      const routes = MODULE_ROUTE_DIRS[module as ModuleName].map((dir) => join(APP_DIR, dir));
      expect(
        routes.some(hasRoutePage),
        `live module ${label} (${module}) has no real route: ${routes.join(", ")}`,
      ).toBe(true);
    }
  });

  test("the detector is load-bearing: a missing directory reads as no route", () => {
    expect(hasRoutePage(join(APP_DIR, "definitely", "absent"))).toBe(false);
    // Sanity anchor: the public tree itself resolves.
    expect(hasRoutePage(join(APP_DIR, "(public)"))).toBe(true);
  });
});

describe("landing honesty invariant", () => {
  test("REGISTRY_MODULE_COUNT bounds the live claim", () => {
    expect(typeof REGISTRY_MODULE_COUNT).toBe("number");
    expect(REGISTRY_MODULE_COUNT).toBeGreaterThanOrEqual(LIVE_MODULES.length);
  });

  test("live and upcoming partition the registry exactly", () => {
    expect(REGISTRY_MODULE_COUNT).toBe(MODULE_NAMES.length);
    expect(LIVE_MODULES.length + ROADMAP_MODULES.length).toBe(REGISTRY_MODULE_COUNT);
  });
});
