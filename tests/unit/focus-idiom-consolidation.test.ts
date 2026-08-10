/**
 * Focus idiom consolidation guards (UI-15).
 *
 * The component layer has exactly one focus idiom: the shadcn focus-visible
 * recipe used by Button/Input —
 *
 *   outline-none focus-visible:border-ring focus-visible:ring-ring/50
 *   focus-visible:ring-[3px]
 *
 * Three recipes used to compete: this one, the legacy bare
 * `focus:ring-2 focus:ring-offset-2` on the dialog/sheet close buttons and
 * DarkModeToggle, and a globals.css `.focus-ring` box-shadow utility keyed on
 * `:focus` (ring on mouse click, not keyboard focus). This file keeps the
 * convergence:
 *
 *   1. The dialog/sheet close buttons and DarkModeToggle carry the modern
 *      focus-visible recipe and no `focus:ring-*` / ring-offset leftovers.
 *   2. No bare `focus:ring-*` or `focus:outline-*` utility anywhere in the
 *      primitive layer (`src/components/ui/`). `focus-visible:` and
 *      `has-focus:` variants are the accepted forms.
 *   3. globals.css keeps the converged base: exactly one universal
 *      `outline-ring/50` @layer base block, the themed `:focus-visible`
 *      outline fallback for content elements that carry no ring classes of
 *      their own (plain links, skip link), and no `.focus-ring` utility.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function src(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const MODERN_RECIPE = [
  "focus-visible:border-ring",
  "focus-visible:ring-ring/50",
  "focus-visible:ring-[3px]",
] as const;

// Bare `focus:` ring/outline utilities. The character class before `focus:`
// keeps `focus-visible:` (dash follows `focus`) and `has-focus:` out.
const BARE_FOCUS_RING = /[\s"'`]focus:(ring|outline)-/;

// ---------------------------------------------------------------------------
// (a) Named legacy carriers now use the focus-visible recipe
// ---------------------------------------------------------------------------

describe("dialog/sheet close buttons use the focus-visible recipe", () => {
  for (const file of ["src/components/ui/dialog.tsx", "src/components/ui/sheet.tsx"]) {
    test(`${file} carries the modern recipe, no legacy focus ring`, () => {
      const code = src(file);
      for (const cls of MODERN_RECIPE) {
        expect(code, `${file} should use ${cls}`).toContain(cls);
      }
      expect(code, `${file} keeps a bare focus: ring utility`).not.toMatch(BARE_FOCUS_RING);
      expect(code).not.toContain("ring-offset-background");
    });
  }
});

describe("DarkModeToggle uses the focus-visible recipe", () => {
  const code = src("src/components/ui/dark-mode-toggle.tsx");

  test("carries the modern recipe", () => {
    for (const cls of MODERN_RECIPE) {
      expect(code, `dark-mode-toggle should use ${cls}`).toContain(cls);
    }
  });

  test("no legacy ring-offset recipe", () => {
    expect(code).not.toContain("focus-visible:ring-2");
    expect(code).not.toContain("ring-offset-2");
    expect(code).not.toContain("ring-offset-background");
  });
});

// ---------------------------------------------------------------------------
// (b) Primitive layer: no bare focus ring idiom anywhere
// ---------------------------------------------------------------------------

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("src/components/ui/ carries no bare focus: ring idiom", () => {
  const files = walk(join(ROOT, "src/components/ui"));

  test("primitive layer is non-empty", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    test(file.replace(`${ROOT}/`, ""), () => {
      const code = readFileSync(file, "utf8");
      expect(code).not.toMatch(BARE_FOCUS_RING);
    });
  }
});

// ---------------------------------------------------------------------------
// (c) globals.css focus base is converged
// ---------------------------------------------------------------------------

const GLOBALS = src("src/app/globals.css");

describe("globals.css focus base", () => {
  test("the .focus-ring utility is gone", () => {
    expect(GLOBALS).not.toMatch(/\.focus-ring\b/);
  });

  test("exactly one universal outline-ring/50 @layer base block", () => {
    const copies = GLOBALS.match(/@layer base\s*\{\s*\*\s*\{[^}]*outline-ring\/50/g) ?? [];
    expect(copies).toHaveLength(1);
  });

  test("themed :focus-visible outline fallback kept for content elements", () => {
    expect(GLOBALS).toMatch(/:focus-visible\s*\{\s*outline:\s*2px solid var\(--ring\)/);
  });
});
