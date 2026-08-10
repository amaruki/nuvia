/**
 * Theme registry verification guards (UI-42).
 *
 * src/config/themes.ts is the single extension point for user-selectable
 * themes: next-themes writes the chosen id as the data-theme attribute on
 * <html> (ThemeProvider in src/app/layout.tsx), and src/app/globals.css
 * scopes each palette as a [data-theme="<id>"] block. Adding a theme must be
 * a two-step operation that never touches the picker components. Guards:
 *
 *   1. Registry shape: unique non-empty ids, at least one light and one dark
 *      palette, PRIMARY_* ids resolve from the registry itself, THEME_IDS
 *      mirrors APP_THEMES, isDarkTheme maps binary surfaces (sonner).
 *   2. CSS sync: :root is the primary light palette; every other registered
 *      id has a [data-theme="<id>"] palette block overriding every color and
 *      shadow token from :root; dark themes (and only dark themes) join the
 *      @custom-variant dark line; no unregistered palette blocks.
 *   3. Consumer wiring: the layout ThemeProvider, DarkModeToggle, dashboard
 *      preferences theme cards, quick-settings radio group, and the sonner
 *      toaster all read from the registry; no hardcoded light/dark bypasses
 *      anywhere in src/.
 *   4. The documented add-a-theme steps state the real contract — every
 *      color and shadow token — and do not ask authors to re-declare the
 *      theme-independent constants (--font-*, --radius, --spacing,
 *      --tracking-normal), which the dark-block hygiene guards forbid.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  APP_THEMES,
  PRIMARY_DARK_THEME_ID,
  PRIMARY_LIGHT_THEME_ID,
  THEME_IDS,
  isDarkTheme,
} from "../../src/config/themes";

const ROOT = join(import.meta.dir, "..", "..");

function src(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const GLOBALS = src("src/app/globals.css");

// ---------------------------------------------------------------------------
// globals.css token helpers
// ---------------------------------------------------------------------------

function tokenNames(block: string): string[] {
  return [...block.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1]);
}

function tokenValue(block: string, name: string): string {
  // Shadow values span multiple lines; accumulate until the terminating `;`.
  const lines = block.split("\n");
  const start = lines.findIndex((entry) => entry.trimStart().startsWith(`${name}:`));
  if (start === -1) return "";
  const collected: string[] = [];
  for (const line of lines.slice(start)) {
    collected.push(line);
    if (line.includes(";")) break;
  }
  return collected
    .join(" ")
    .replace(/;.*$/, "")
    .replace(new RegExp(`^\\s*${name}:`), "")
    .trim();
}

/** Color + shadow tokens: the palette-dependent set a theme block must override. */
function appearanceTokens(block: string): string[] {
  return tokenNames(block).filter(
    (name) =>
      name.startsWith("--shadow") || /^(oklch|hsl|rgb|lab|lch)\(/.test(tokenValue(block, name)),
  );
}

// `[data-theme="dark"] {` — the selector form that opens a palette block.
// The unquoted `[data-theme=dark]` in @custom-variant never matches.
function paletteBlock(id: string): string {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = GLOBALS.match(new RegExp(`\\[data-theme="${escaped}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? "";
}

const PALETTE_SELECTOR_IDS = [...GLOBALS.matchAll(/\[data-theme="([\w-]+)"\]\s*\{/g)].map(
  (m) => m[1],
);
const CUSTOM_VARIANT_LINE = GLOBALS.match(/@custom-variant dark\s*\(([\s\S]*?)\);/)?.[1] ?? "";

// ---------------------------------------------------------------------------
// 1. Registry shape and behavior
// ---------------------------------------------------------------------------

describe("theme registry shape", () => {
  test("ids are unique and non-empty; labels present", () => {
    const ids = APP_THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const theme of APP_THEMES) {
      expect(theme.id.length).toBeGreaterThan(0);
      expect(theme.label.length).toBeGreaterThan(0);
    }
  });

  test("registry holds at least one light and one dark palette", () => {
    expect(APP_THEMES.some((theme) => !theme.dark)).toBe(true);
    expect(APP_THEMES.some((theme) => theme.dark)).toBe(true);
  });

  test("PRIMARY_* ids resolve from the registry, THEME_IDS mirrors it", () => {
    expect(THEME_IDS).toEqual(APP_THEMES.map((theme) => theme.id));
    expect(THEME_IDS).toContain(PRIMARY_LIGHT_THEME_ID);
    expect(THEME_IDS).toContain(PRIMARY_DARK_THEME_ID);
    expect(APP_THEMES.find((theme) => theme.id === PRIMARY_LIGHT_THEME_ID)?.dark).toBe(false);
    expect(APP_THEMES.find((theme) => theme.id === PRIMARY_DARK_THEME_ID)?.dark).toBe(true);
  });

  test("isDarkTheme maps binary surfaces; unknown ids count as light", () => {
    expect(isDarkTheme(PRIMARY_DARK_THEME_ID)).toBe(true);
    expect(isDarkTheme(PRIMARY_LIGHT_THEME_ID)).toBe(false);
    expect(isDarkTheme("no-such-theme")).toBe(false);
    expect(isDarkTheme(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. CSS <-> registry sync
// ---------------------------------------------------------------------------

describe("palette blocks stay in sync with the registry", () => {
  test("every non-default theme id has a [data-theme] palette block", () => {
    for (const theme of APP_THEMES) {
      if (theme.id === PRIMARY_LIGHT_THEME_ID) continue; // :root is its palette
      expect(paletteBlock(theme.id), `missing palette block for "${theme.id}"`).not.toBe("");
    }
  });

  test("no palette block exists for an unregistered id", () => {
    for (const id of PALETTE_SELECTOR_IDS) {
      expect(THEME_IDS, `unregistered palette block [data-theme="${id}"]`).toContain(id);
    }
  });

  test("dark themes, and only dark themes, join the @custom-variant dark line", () => {
    expect(CUSTOM_VARIANT_LINE.length).toBeGreaterThan(0);
    for (const theme of APP_THEMES) {
      const present = CUSTOM_VARIANT_LINE.includes(`[data-theme=${theme.id}]`);
      expect(present, `"${theme.id}" in @custom-variant dark`).toBe(theme.dark);
    }
  });

  test("every theme block overrides every color and shadow token from :root", () => {
    const rootBlock = GLOBALS.match(/(?:^|\n):root\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(rootBlock.length).toBeGreaterThan(0);
    const expected = appearanceTokens(rootBlock);
    expect(expected.length).toBeGreaterThan(0);
    for (const theme of APP_THEMES) {
      if (theme.id === PRIMARY_LIGHT_THEME_ID) continue;
      const block = paletteBlock(theme.id);
      const declared = new Set(tokenNames(block));
      for (const token of expected) {
        expect(declared.has(token), `--${token} overridden by "${theme.id}"`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Consumer wiring
// ---------------------------------------------------------------------------

describe("consumers read the registry", () => {
  test("root layout feeds THEME_IDS to the ThemeProvider on data-theme", () => {
    const layout = src("src/app/layout.tsx");
    expect(layout).toContain('import { THEME_IDS } from "@/config/themes"');
    expect(layout).toMatch(/themes=\{THEME_IDS\}/);
    expect(layout).toContain('attribute="data-theme"');
    expect(layout).toContain('storageKey="theme"');
  });

  test("sonner maps registered ids through isDarkTheme", () => {
    const sonner = src("src/components/ui/sonner.tsx");
    expect(sonner).toContain('import { isDarkTheme } from "@/config/themes"');
  });

  test("DarkModeToggle flips between the registry primary ids", () => {
    const toggle = src("src/components/ui/dark-mode-toggle.tsx");
    expect(toggle).toContain("PRIMARY_DARK_THEME_ID");
    expect(toggle).toContain("PRIMARY_LIGHT_THEME_ID");
    expect(toggle).toContain('from "@/config/themes"');
  });

  test("preferences cards and quick-settings radio group render APP_THEMES", () => {
    expect(src("src/app/dashboard/preferences/page.tsx")).toContain(
      'import { APP_THEMES } from "@/config/themes"',
    );
    expect(
      src("src/components/dashboard/layout/dashboard-header/quick-settings-menu.tsx"),
    ).toContain('import { APP_THEMES } from "@/config/themes"');
  });

  test("no hardcoded light/dark theme bypasses in src/", () => {
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(tsx?|css)$/.test(entry)) {
          const code = readFileSync(full, "utf8");
          if (/setTheme\(\s*["'](light|dark)["']\s*\)/.test(code))
            offenders.push(`${full}: setTheme literal`);
          if (/(?:resolvedTheme|theme)\s*===\s*["'](light|dark)["']/.test(code))
            offenders.push(`${full}: theme comparison literal`);
        }
      }
    };
    walk(join(ROOT, "src"));
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Documented contract matches the enforced one
// ---------------------------------------------------------------------------

describe("add-a-theme documentation states the enforced contract", () => {
  // The dark-block hygiene guards forbid re-declaring --font-*/--radius in
  // theme blocks, so the instructions must scope the override to the
  // palette-dependent tokens (colors and shadows), not "every token".
  for (const [file, target] of [
    ["src/config/themes.ts", src("src/config/themes.ts")],
    ["src/app/globals.css", GLOBALS],
  ] as const) {
    test(`${file} no longer claims every token is overridden`, () => {
      expect(target).not.toMatch(/overrides every token/i);
    });

    test(`${file} names the color and shadow token contract`, () => {
      expect(target).toMatch(/every\s+color\s+and\s+shadow\s+token/i);
    });
  }
});
