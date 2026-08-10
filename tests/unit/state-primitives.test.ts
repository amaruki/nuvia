/**
 * UI-14 — State primitives: adoption, not invention.
 *
 * Pins the repo to the shipped loading/empty primitives:
 *   (a) globals.css must not re-time or re-declare Tailwind's pulse/bounce
 *   (b) WidgetContainer composes LoadingSpinner and EmptyState
 *   (c) the duplicate learning EmptyState is gone; courses use the ui one
 *   (d) no hand-rolled spinner divs outside the LoadingSpinner primitive
 *   (e) animate-pulse literals only live in the Skeleton primitive and the
 *       two sanctioned live-indicator surfaces
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function src(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const SRC_FILES = walk(join(ROOT, "src")).map((abs) =>
  abs.slice(ROOT.length + 1).replaceAll("\\", "/"),
);

function linesWith(source: string, ...needles: string[]): string[] {
  return source.split("\n").filter((line) => needles.every((needle) => line.includes(needle)));
}

describe("globals.css animation hygiene", () => {
  const globals = src("src/app/globals.css");

  test("no .animate-pulse override re-timing Tailwind's utility", () => {
    expect(globals).not.toMatch(/\.animate-pulse\s*\{/);
  });

  test("no .animate-bounce override", () => {
    expect(globals).not.toMatch(/\.animate-bounce\s*\{/);
  });

  test("no custom @keyframes pulse colliding with Tailwind", () => {
    expect(globals).not.toMatch(/@keyframes\s+pulse\s*\{/);
  });

  test("no custom @keyframes bounce colliding with Tailwind", () => {
    expect(globals).not.toMatch(/@keyframes\s+bounce\s*\{/);
  });
});

describe("WidgetContainer composes the primitives", () => {
  const wc = src("src/components/ui/widget-container.tsx");

  test("imports LoadingSpinner", () => {
    expect(wc).toMatch(/from\s+["']\.\/loading-spinner["']/);
  });

  test("imports EmptyState", () => {
    expect(wc).toMatch(/from\s+["']\.\/empty-state["']/);
  });

  test("renders LoadingSpinner for the loading branch", () => {
    expect(wc).toMatch(/<LoadingSpinner\b/);
  });

  test("renders EmptyState for the empty branch", () => {
    expect(wc).toMatch(/<EmptyState\b/);
  });

  test("carries no hand-rolled spinner markup", () => {
    expect(wc).not.toContain("animate-spin");
  });
});

describe("no duplicate EmptyState", () => {
  test("learning courses local empty-state.tsx is deleted", () => {
    expect(
      existsSync(join(ROOT, "src/app/dashboard/learning/courses/_components/empty-state.tsx")),
    ).toBe(false);
  });

  test("learning courses page uses the ui EmptyState", () => {
    const page = src("src/app/dashboard/learning/courses/page.tsx");
    expect(page).toMatch(/from\s+["']@\/components\/ui\/empty-state["']/);
  });
});

describe("no hand-rolled spinner divs", () => {
  const ALLOWLIST = new Set(["src/components/ui/loading-spinner.tsx"]);

  test("zero animate-spin + rounded-full + border lines outside the primitive", () => {
    const offenders: string[] = [];
    for (const file of SRC_FILES) {
      if (ALLOWLIST.has(file)) continue;
      const matches = linesWith(src(file), "animate-spin", "rounded-full", "border");
      if (matches.length > 0) offenders.push(`${file} (${matches.length})`);
    }
    expect(offenders).toEqual([]);
  });
});

describe("animate-pulse routes through the Skeleton primitive", () => {
  const ALLOWLIST = new Set([
    "src/components/ui/skeleton.tsx", // the primitive itself
    "src/components/memberships/member-card.tsx", // live membership-status dot
    "src/components/ui/full-calendar/time-table.tsx", // live current-time indicator
  ]);

  test("no hand-rolled pulse skeletons", () => {
    const offenders: string[] = [];
    for (const file of SRC_FILES) {
      if (ALLOWLIST.has(file)) continue;
      if (src(file).includes("animate-pulse")) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
