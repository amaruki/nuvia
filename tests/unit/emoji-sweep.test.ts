/**
 * UI-13 emoji sweep guards (docs/planning/03-frontend-improvement-plan.md,
 * UI-13 "Emoji are not icons"): functional UI chrome uses lucide icons, not
 * emoji glyphs. The donations-table donor/donation-type glyphs were already
 * replaced under the UI-09 finance tables work (guarded in
 * tests/tables-finance.test.ts); this file pins the rest of the sweep:
 * membership sort options, the dashboard footer heart, the welcome email
 * celebration glyph, and the category form's lucide icon picker pairing.
 * Source-scanning only, no React is executed.
 *
 * Repo-wide exceptions, all deliberate:
 * - `do-dont-demo.tsx` renders an emoji inside its "Don't" tile to teach
 *   this exact rule.
 * - The add-category-form emoji affordance (input placeholder and toggle
 *   default) is user data, not chrome; the plan explicitly accepts it, and
 *   the pairing requirement is the lucide icon picker asserted below.
 * - `src/lib/auth/email.ts` and `src/lib/session-cache/cache-ops.ts` log
 *   strings are operator output, not UI; logged in TODO.md's good-first-issue
 *   list.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function src(relativePath: string): string {
  expect(existsSync(join(ROOT, relativePath)), `expected ${relativePath} to exist`).toBe(true);
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

/** Matches pictographs, dingbats, stars, and hearts. */
const EMOJI_PATTERN = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2764}]/u;

// ---------------------------------------------------------------------------
// (a) Membership sort options carry lucide icons, not emoji strings
// ---------------------------------------------------------------------------

const MEMBERSHIP_HELPERS = "src/components/memberships/membership-list/helpers.ts";
const MEMBERSHIP_LIST_HEADER = "src/components/memberships/membership-list/list-header.tsx";

describe("membership sort options replace emoji glyphs with lucide icons (UI-13)", () => {
  test("no emoji glyphs remain in the sort option registry", () => {
    const source = src(MEMBERSHIP_HELPERS);
    for (const glyph of ["🆕", "📅", "⭐", "📍", "🏢"]) {
      expect(source).not.toContain(glyph);
    }
    expect(source).not.toMatch(/icon:\s*"/);
  });

  test("sort options reference lucide icon components", () => {
    const source = src(MEMBERSHIP_HELPERS);
    expect(source).toContain('from "lucide-react"');
    for (const icon of ["ArrowUpAZ", "ArrowDownAZ", "Sparkles", "Star", "MapPin", "Building2"]) {
      expect(source).toContain(icon);
    }
  });

  test("list header renders the sort icon as a component with hidden semantics", () => {
    const source = src(MEMBERSHIP_LIST_HEADER);
    expect(source).not.toMatch(/\{option\.icon\}/);
    expect(source).toContain("aria-hidden");
  });
});

// ---------------------------------------------------------------------------
// (b) Dashboard footer heart is a lucide icon with screen-reader text
// ---------------------------------------------------------------------------

describe("dashboard footer replaces the heart glyph (UI-13)", () => {
  const source = src("src/components/dashboard/layout/dashboard-footer.tsx");

  test("no heart glyph remains", () => {
    expect(source).not.toContain("❤");
  });

  test("renders the lucide Heart icon", () => {
    expect(source).toMatch(/import\s*\{[^}]*\bHeart\b[^}]*\}\s*from\s*"lucide-react"/);
    expect(source).toMatch(/<Heart\b/);
  });

  test("keeps the word for assistive tech via sr-only text", () => {
    expect(source).toContain("sr-only");
  });
});

// ---------------------------------------------------------------------------
// (c) Welcome email drops the celebration glyph
// ---------------------------------------------------------------------------

describe("welcome email drops the celebration glyph (UI-13)", () => {
  const source = src("src/components/email-template/welcome.tsx");

  test("no celebration glyph remains", () => {
    expect(source).not.toContain("🎉");
  });

  test("keeps the heading copy", () => {
    expect(source).toContain("Welcome Aboard!");
  });
});

// ---------------------------------------------------------------------------
// (d) Category form pairs the emoji field with a lucide icon picker
// ---------------------------------------------------------------------------

const ICON_PICKER =
  "src/app/dashboard/content/categories/_components/category-form/icon-picker.tsx";
const ICON_OPTIONS =
  "src/app/dashboard/content/categories/_components/category-form/icon-options.ts";
const VISUAL_SECTION =
  "src/app/dashboard/content/categories/_components/category-form/visual-settings-section.tsx";

describe("category form pairs the emoji field with a lucide icon picker (UI-13)", () => {
  test("a curated icon option registry exists with broad lucide coverage", () => {
    const source = src(ICON_OPTIONS);
    expect(source).toContain('from "lucide-react"');
    const importBlock = source.match(/import\s*\{([^}]+)\}\s*from\s*"lucide-react"/) ?? ["", ""];
    const names = importBlock[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    expect(names.length).toBeGreaterThanOrEqual(20);
    // Names used by existing stored data and surrounding UI keep resolving.
    for (const icon of ["Folder", "BookOpen", "Calendar", "MessageSquare", "Megaphone"]) {
      expect(source).toContain(icon);
    }
  });

  test("the picker offers search, an accessible grid, and selection state", () => {
    const source = src(ICON_PICKER);
    expect(source).toContain("export function CategoryIconPicker");
    expect(source).toContain('from "./icon-options"');
    expect(source).toContain('type="search"');
    expect(source).toContain("aria-pressed");
    expect(source).toContain("aria-label");
  });

  test("the visual settings section renders the picker and keeps the emoji field", () => {
    const source = src(VISUAL_SECTION);
    expect(source).toContain("<CategoryIconPicker");
    expect(source).toContain('name="emoji"');
  });
});

// ---------------------------------------------------------------------------
// (e) Repo-wide: no emoji glyphs under src/ outside the documented exceptions
// ---------------------------------------------------------------------------

const EMOJI_ALLOWLIST = [
  // Deliberate "Don't" example teaching this rule on the design preview page.
  "src/app/design/preview/_components/do-dont-demo.tsx",
  // Emoji user-data affordance (accepted by the plan): input placeholder.
  "src/app/dashboard/content/categories/_components/category-form/visual-settings-section.tsx",
  // Logger strings, not UI chrome; tracked in TODO.md's good-first-issue list.
  "src/lib/auth/email.ts",
  "src/lib/session-cache/cache-ops.ts",
];

describe("no emoji glyphs remain in UI chrome under src/ (UI-13)", () => {
  const files = walk(join(ROOT, "src")).filter((file) => /\.(ts|tsx)$/.test(file));

  test("every emoji hit sits on the documented allowlist", () => {
    const hits = files
      .filter((file) => EMOJI_PATTERN.test(readFileSync(file, "utf8")))
      .map((file) => file.slice(ROOT.length + 1))
      .filter((file) => !EMOJI_ALLOWLIST.includes(file));
    expect(hits).toEqual([]);
  });
});
