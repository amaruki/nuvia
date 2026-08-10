/**
 * Contrast-and-names guards for the axe smoke gate (WCAG 1.4.3 / 4.1.2).
 *
 * The runtime gate (`bun run test:a11y`) boots the full stack and fails the
 * suite on any critical/serious axe violation. This file encodes the same
 * expectations as fast, static guards so regressions fail before the smoke
 * gate even starts:
 *
 *   1. Theme token contrast: the finance-dues badge (light `--destructive`
 *      + white text), the chapters/committees directory badges
 *      (`--secondary` pair in both themes), and the job-card default badge
 *      (`--primary` pair) must all clear >= 4.5:1. Contrast is computed
 *      from the oklch values in globals.css, not hardcoded.
 *   2. The directory badge contrast failures were caused by local
 *      `text-muted-foreground` / sub-11px overrides on `bg-secondary` —
 *      those overrides must not come back.
 *   3. Page-level hardcoded palette fixes: content-media stats use
 *      `bg-card`, the jobs board status badges use semantic tone tokens
 *      (no raw palette, no dark: pairs — semantic tokens adapt per
 *      theme), the my-courses empty state uses `text-muted-foreground`,
 *      and the jobs board no longer paints Badges `bg-blue-600`.
 *   4. Accessible names: the learning-courses difficulty Select trigger
 *      carries a non-empty aria-label.
 *   5. Standalone blue links (`text-blue-600 ... hover:underline`) must
 *      pair `dark:text-blue-400` so they clear >= 4.5:1 on dark cards.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function src(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

// ---------------------------------------------------------------------------
// oklch -> WCAG contrast helpers (self-contained; mirrors scripts/audit math)
// ---------------------------------------------------------------------------

function parseOklch(value: string): [number, number, number] {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) throw new Error(`unsupported color: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function token(theme: string, name: string): [number, number, number] {
  const css = src("src/app/globals.css");
  const escapedTheme = theme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockMatch = css.match(new RegExp(`${escapedTheme}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));
  const block = blockMatch?.[1] ?? "";
  const line = block.split("\n").find((entry) => entry.includes(`--${name}:`));
  if (!line) throw new Error(`missing --${name} in ${theme} block`);
  const value = line.split(":").slice(1).join(":").trim().replace(/;.*$/, "").trim();
  return parseOklch(value);
}

function rgbToken(theme: string, name: string): [number, number, number] {
  return oklchToRgb(token(theme, name));
}

function oklchToRgb([l, c, h]: [number, number, number]): [number, number, number] {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const cube = (x: number) => x * x * x;
  const lr = cube(l_);
  const mg = cube(m_);
  const st = cube(s_);
  const toChannel = (v: number) => {
    const linearValue = Math.min(1, Math.max(0, v));
    const encoded =
      linearValue <= 0.0031308
        ? 12.92 * linearValue
        : 1.055 * Math.pow(linearValue, 1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  };
  return [
    toChannel(4.0767416621 * lr - 3.3077115913 * mg + 0.2309699292 * st),
    toChannel(-1.2684380046 * lr + 2.6097574011 * mg - 0.3413193965 * st),
    toChannel(-0.0041960863 * lr - 0.7034186147 * mg + 1.707614701 * st),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(
  foreground: [number, number, number],
  background: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [0, 1, 2].map((index) =>
    Math.round(foreground[index] * alpha + background[index] * (1 - alpha)),
  ) as [number, number, number];
}

const WHITE: [number, number, number] = [255, 255, 255];
const DARK_CARD = oklchToRgb(token('[data-theme="dark"]', "card"));

// ---------------------------------------------------------------------------
// 1. Theme token contrast
// ---------------------------------------------------------------------------

describe("theme token contrast (WCAG 1.4.3)", () => {
  test("light destructive badge: white on --destructive clears 4.5:1 (finance-dues)", () => {
    expect(contrast(rgbToken(":root", "destructive"), WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  test("light default badge: --primary-foreground on --primary clears 4.5:1 (job cards)", () => {
    const ratio = contrast(rgbToken(":root", "primary"), rgbToken(":root", "primary-foreground"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("light secondary badge pair clears 4.5:1 (directory badges)", () => {
    const ratio = contrast(
      rgbToken(":root", "secondary"),
      rgbToken(":root", "secondary-foreground"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("dark secondary badge pair clears 4.5:1 (chapters/committees directory)", () => {
    const ratio = contrast(
      rgbToken('[data-theme="dark"]', "secondary"),
      rgbToken('[data-theme="dark"]', "secondary-foreground"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("dark primary badge pair clears 4.5:1", () => {
    const ratio = contrast(
      rgbToken('[data-theme="dark"]', "primary"),
      rgbToken('[data-theme="dark"]', "primary-foreground"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("dark destructive badge: white on --destructive/60 over card clears 4.5:1", () => {
    const blended = blend(rgbToken('[data-theme="dark"]', "destructive"), DARK_CARD, 0.6);
    expect(contrast(blended, WHITE)).toBeGreaterThanOrEqual(4.5);
  });
});

// ---------------------------------------------------------------------------
// 2. Directory badge overrides (the actual 2.41:1 root cause)
// ---------------------------------------------------------------------------

describe("chapters/committees directory badges", () => {
  const badgeSites = [
    "src/components/chapters/chapters-overview-cards/top-performing-card.tsx",
    "src/components/committees/committees-overview-cards.tsx",
  ];

  test("secondary badges keep their secondary-foreground color (no muted override)", () => {
    for (const file of badgeSites) {
      const source = src(file);
      const badgeBlock = source.match(/Badge\s+variant="secondary"[\s\S]{0,160}/g) ?? [];
      expect(badgeBlock.length).toBeGreaterThan(0);
      for (const block of badgeBlock) {
        expect(block).not.toContain("text-muted-foreground");
      }
    }
  });

  test("directory badges are not rendered below 11px", () => {
    for (const file of badgeSites) {
      expect(src(file)).not.toContain("text-[10px]");
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Page-level hardcoded palette fixes
// ---------------------------------------------------------------------------

describe("content-media stats cards", () => {
  test("stats cards use the card token, not hardcoded bg-white", () => {
    const source = src("src/app/dashboard/content/media/_components/stats-overview.tsx");
    expect(source).not.toContain("bg-white");
    expect(source.match(/bg-card/g)?.length).toBeGreaterThanOrEqual(4);
  });
});

describe("jobs board status + role badges", () => {
  test("status badge styles use semantic tone tokens, no raw palette", () => {
    const source = src("src/app/dashboard/jobs/page.tsx");
    const stylesBlock = source.slice(source.indexOf("STATUS_BADGE_STYLES"));
    for (const status of ["DRAFT", "PUBLISHED", "ARCHIVED", "FILLED", "CLOSED", "CANCELLED"]) {
      const entry = stylesBlock.match(new RegExp(`${status}:\\s*"([^"]+)"`))?.[1];
      expect(entry, `${status} style`).toBeDefined();
      expect(entry, `${status} token text color`).toMatch(
        /text-(warning|success|info|destructive|muted-foreground)\b/,
      );
    }
    expect(stylesBlock).not.toContain("#00a63e");
    expect(stylesBlock).not.toMatch(
      /\b(slate|gray|zinc|red|orange|amber|yellow|green|blue|indigo)-\d{2,3}\b/,
    );
  });

  test("job-card default badge is no longer painted bg-blue-600", () => {
    const source = src("src/app/dashboard/jobs/_components/job-card.tsx");
    expect(source).not.toContain("bg-blue-600");
    expect(source).not.toContain("text-gray-600");
  });
});

describe("growth and remote-work stats", () => {
  test("growth stats use >= 700 light tones with dark variants", () => {
    const files = [
      "src/components/chapters/chapters-overview-cards/top-performing-card.tsx",
      "src/app/dashboard/organization/chapters/_components/chapters-tab.tsx",
      "src/app/dashboard/organization/chapters/_components/overview-tab.tsx",
      "src/app/dashboard/organization/chapters/[id]/_components/chapter-helpers.tsx",
      "src/app/dashboard/organization/chapters/[id]/_components/chapter-finances-tab.tsx",
      "src/components/chapters/chapter-details-modal/helpers.tsx",
      "src/app/dashboard/organization/committees/_components/committees-overview-tab.tsx",
      "src/components/chapters/chapters-overview-cards/stat-cards.tsx",
      "src/components/chapters/chapter-details-modal/finances-tab.tsx",
      "src/app/dashboard/organization/committees/_components/committees-list-tab.tsx",
      "src/app/dashboard/awards/nominations/page.tsx",
      "src/components/content/announcements-overview-cards/top-performing-card.tsx",
      "src/components/content/articles-overview-cards/top-performing-card.tsx",
      "src/components/content/publications-overview-cards/top-performing-card.tsx",
      "src/components/finance/gateways-overview-cards/stat-cards.tsx",
      "src/components/finance/gateways-overview-cards/top-performing-card.tsx",
    ];
    for (const file of files) {
      const source = src(file);
      // Text-stat class literals (ternary arms) lead with the text color;
      // decorative icon literals lead with sizing classes and are exempt.
      const textStatLiterals = [...source.matchAll(/"([^"]*)"/g)]
        .map((match) => match[1])
        .filter((literal) => /^text-(emerald|rose|amber)-600\b/.test(literal));
      expect(textStatLiterals, file).toEqual([]);
      expect(source, file).toMatch(/dark:text-(emerald|rose|amber)-400/);
    }
  });

  test("job detail remote-work stat uses a dark-safe green", () => {
    const source = src("src/app/(public)/jobs/[id]/page.tsx");
    expect(source).not.toContain("font-medium text-green-600");
    expect(source).toContain("text-green-700 dark:text-green-400");
  });
});

describe("my-courses empty state", () => {
  test("empty state uses muted-foreground, not foreground/50", () => {
    const source = src("src/app/dashboard/learning/my-courses/page.tsx");
    expect(source).not.toContain("text-foreground/50");
    expect(source).toContain("text-muted-foreground");
    expect(source).not.toContain("text-[10px]");
  });
});

// ---------------------------------------------------------------------------
// 4. Accessible names (WCAG 4.1.2)
// ---------------------------------------------------------------------------

describe("accessible names", () => {
  test("learning-courses difficulty Select trigger carries a non-empty aria-label", () => {
    const source = src("src/app/dashboard/learning/courses/page.tsx");
    const trigger = source.match(/SelectTrigger[\s\S]{0,220}aria-label="([^"]+)"/);
    expect(trigger, "SelectTrigger aria-label").not.toBeNull();
    expect((trigger?.[1] ?? "").trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Standalone blue-link dark pairing sweep
// ---------------------------------------------------------------------------

describe("standalone blue links pair dark:text-blue-400", () => {
  function walk(dir: string): string[] {
    const entries: string[] = [];
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) entries.push(...walk(path));
      else if (entry.endsWith(".tsx")) entries.push(path);
    }
    return entries;
  }

  test("every text-blue-600 hover:underline className carries a dark variant", () => {
    const offenders: string[] = [];
    for (const path of [...walk(join(ROOT, "src/app")), ...walk(join(ROOT, "src/components"))]) {
      const source = readFileSync(path, "utf8");
      const literals = [...source.matchAll(/"([^"]*)"/g), ...source.matchAll(/`([^`]*)`/g)].map(
        (match) => match[1],
      );
      for (const literal of literals) {
        if (
          literal.includes("text-blue-600") &&
          literal.includes("hover:underline") &&
          !literal.includes("dark:text-blue-400")
        ) {
          offenders.push(path);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("member announcements and public directory cross-links got the dark pair", () => {
    const announcements = src("src/app/dashboard/announcements/page.tsx");
    for (const literal of [...announcements.matchAll(/"([^"]*)"/g)].map((match) => match[1])) {
      if (literal.includes("text-blue-600")) {
        expect(literal).toContain("dark:text-blue-400");
      }
    }
    for (const file of [
      "src/app/(public)/chapters/page.tsx",
      "src/app/(public)/committees/page.tsx",
    ]) {
      expect(src(file), file).toContain("text-blue-600 dark:text-blue-400 hover:underline");
    }
  });
});
