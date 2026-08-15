/**
 * Token discipline guards (E1aTokens workstream).
 *
 * Locks in the semantic status tokens and the migration off raw Tailwind
 * palette pairs:
 *
 *   (a) globals.css defines --success/--warning/--info in BOTH the :root and
 *       [data-theme="dark"] blocks and registers each in @theme inline. The
 *       authored values must clear WCAG AA (4.5:1) against the theme's card
 *       background when used as text, including over their own /15 soft tint
 *       (the badge recipe), in both themes.
 *   (b) badge.tsx exposes success/warning/info variants in the soft-tint
 *       house style without dropping the focus-visible ring behavior.
 *   (c) The eight status badge maps carry zero raw `*-100 text-*-800`
 *       palette pairs (and no -100 bg / -800 text classes at all).
 *   (d) Zero `hsl(var(--` occurrences anywhere in src/ — the token vars are
 *       full oklch() colors now, so the legacy hsl() wrapper is invalid CSS.
 *   (e) The dark block authors real shadows: no alpha-zero `/ 0)` entries,
 *       a non-zero --shadow-opacity, the 0px/4px offset scale intact, and no
 *       dead verbatim re-declarations of the :root font/radius tokens.
 *   (f) Wave 2: the deferred centralized badge maps (jobs status, session
 *       card chrome, committee/workspace type, user status/auth/role,
 *       permission, event colors) carry zero raw palette classes and no
 *       palette dark: overrides; the dead event-styles.ts is deleted; zero
 *       `-100 text-*-800` pairs remain anywhere in src/.
 *   (g) Wave 3: the membership tier/status map (member-card) and the
 *       transactional email templates carry zero raw palette classes and no
 *       palette dark: overrides; the emails resolve their colors through the
 *       shared email-theme tailwind config (email clients never load
 *       globals.css); the shared footer rides the same theme.
 *   (h) Wave 4: user stats, the security tab, and the announcement banner
 *       gradients carry zero raw palette classes; banner gradient stops use
 *       token colors, not raw palette stops.
 *
 * Run ONLY this file: `bun test tests/token-discipline.test.ts`.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function src(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

// ---------------------------------------------------------------------------
// globals.css block extraction
// ---------------------------------------------------------------------------

const GLOBALS = src("src/app/globals.css");

function blockOf(pattern: RegExp): string {
  const match = GLOBALS.match(pattern);
  if (!match) throw new Error(`globals.css block not found: ${pattern}`);
  return match[1];
}

// `:root` only — the dark selector `:root[data-theme="dark"]` has `[...]`
// between `:root` and `{`, so it never matches here.
const LIGHT_BLOCK = blockOf(/(?:^|\n):root\s*\{([\s\S]*?)\n\}/);
const DARK_BLOCK = blockOf(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
const THEME_INLINE_BLOCK = blockOf(/@theme inline\s*\{([\s\S]*?)\n\}/);

function declaration(block: string, name: string): string | undefined {
  // Values may span multiple lines (shadow scale); accumulate until the `;`.
  const lines = block.split("\n");
  const start = lines.findIndex((entry) => entry.trimStart().startsWith(`--${name}:`));
  if (start === -1) return undefined;
  const collected: string[] = [];
  for (const line of lines.slice(start)) {
    collected.push(line);
    if (line.includes(";")) break;
  }
  return collected
    .join(" ")
    .replace(/;.*$/, "")
    .replace(new RegExp(`^\\s*--${name}:`), "")
    .trim();
}

// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

function parseOklch(value: string): [number, number, number] {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) throw new Error(`unsupported color: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function oklchToRgb([l, c, h]: [number, number, number]): Rgb {
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

function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function blend(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((index) =>
    Math.round(foreground[index] * alpha + background[index] * (1 - alpha)),
  ) as Rgb;
}

function tokenRgb(themeBlock: string, themeLabel: string, name: string): Rgb {
  const value = declaration(themeBlock, name);
  if (!value) throw new Error(`missing --${name} in ${themeLabel} block`);
  return oklchToRgb(parseOklch(value));
}

const STATUS_TOKENS = ["success", "warning", "info"] as const;

// ---------------------------------------------------------------------------
// (a) Semantic status tokens in globals.css
// ---------------------------------------------------------------------------

describe("semantic status tokens in globals.css", () => {
  for (const name of STATUS_TOKENS) {
    test(`--${name} is declared as oklch in :root`, () => {
      const value = declaration(LIGHT_BLOCK, name);
      expect(value, `--${name} in :root`).toBeDefined();
      expect(value).toMatch(/^oklch\(/);
    });

    test(`--${name} is declared as oklch in [data-theme="dark"]`, () => {
      const value = declaration(DARK_BLOCK, name);
      expect(value, `--${name} in dark block`).toBeDefined();
      expect(value).toMatch(/^oklch\(/);
    });

    test(`--color-${name} is registered in @theme inline`, () => {
      expect(THEME_INLINE_BLOCK).toContain(`--color-${name}: var(--${name});`);
    });
  }

  for (const [themeLabel, themeBlock] of [
    [":root", LIGHT_BLOCK],
    ['[data-theme="dark"]', DARK_BLOCK],
  ] as const) {
    const card = tokenRgb(themeBlock, themeLabel, "card");
    for (const name of STATUS_TOKENS) {
      test(`${themeLabel} --${name} clears AA 4.5:1 as text on the card background`, () => {
        expect(contrast(tokenRgb(themeBlock, themeLabel, name), card)).toBeGreaterThanOrEqual(4.5);
      });

      test(`${themeLabel} --${name} clears AA 4.5:1 over its own /15 badge tint`, () => {
        const color = tokenRgb(themeBlock, themeLabel, name);
        expect(contrast(color, blend(color, card, 0.15))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// (b) Badge variants
// ---------------------------------------------------------------------------

describe("badge.tsx status variants", () => {
  const badge = src("src/components/ui/badge.tsx");

  for (const name of STATUS_TOKENS) {
    test(`exposes a ${name} variant in the soft-tint style`, () => {
      expect(badge).toMatch(new RegExp(`${name}:\\s*"[^"]*bg-${name}/\\d+[^"]*text-${name}[^"]*"`));
    });
  }

  test("keeps the focus-visible ring behavior from the base class", () => {
    expect(badge).toContain("focus-visible:ring-[3px]");
    expect(badge).toContain("focus-visible:ring-ring/50");
  });
});

// ---------------------------------------------------------------------------
// (c) Badge maps migrated off raw palette pairs
// ---------------------------------------------------------------------------

const BADGE_MAP_FILES = [
  "src/app/dashboard/events/_lib/registrations-api.ts",
  "src/app/dashboard/awards/programs/_components/program-utils.ts",
  "src/app/dashboard/memberships/applications/page.tsx",
  "src/app/dashboard/memberships/tiers/_components/stats-overview.tsx",
  "src/app/dashboard/memberships/directory/page.tsx",
  "src/app/dashboard/jobs/[jobId]/applicants/page.tsx",
  "src/app/dashboard/jobs/[jobId]/applicants/[applicantId]/page.tsx",
  "src/app/dashboard/organization/workspaces/[id]/_components/status-badges.tsx",
];

describe("badge maps carry no raw palette pairs", () => {
  for (const file of BADGE_MAP_FILES) {
    const source = src(file);

    test(`${file}: zero -100 text-*-800 palette pairs`, () => {
      expect(source).not.toMatch(/-100\s+text-[a-z]+-800/);
    });

    test(`${file}: zero raw -100 backgrounds and -800 text classes`, () => {
      expect(source).not.toMatch(/bg-[a-z]+-100\b/);
      expect(source).not.toMatch(/text-[a-z]+-800\b/);
    });
  }

  test("registration map still covers every status with token classes", () => {
    const source = src(BADGE_MAP_FILES[0]);
    const map = source.slice(
      source.indexOf("REGISTRATION_STATUS_BADGE_STYLES"),
      source.indexOf("};", source.indexOf("REGISTRATION_STATUS_BADGE_STYLES")) + 2,
    );
    for (const status of [
      "PENDING",
      "CONFIRMED",
      "WAITLISTED",
      "CANCELED",
      "ATTENDED",
      "NO_SHOW",
    ]) {
      expect(map).toMatch(new RegExp(`${status}:\\s*"`));
    }
    expect(map).toContain("text-info");
    expect(map).toContain("text-success");
    expect(map).toContain("text-warning");
    expect(map).toContain("text-destructive");
  });

  test("job application maps still cover every status", () => {
    for (const file of [BADGE_MAP_FILES[5], BADGE_MAP_FILES[6]]) {
      const source = src(file);
      for (const status of [
        "PENDING",
        "REVIEWING",
        "SHORTLISTED",
        "INTERVIEWING",
        "OFFERED",
        "HIRED",
        "REJECTED",
        "WITHDRAWN",
      ]) {
        expect(source, `${file} covers ${status}`).toMatch(new RegExp(`${status}:\\s*"`));
      }
    }
  });

  test("category map still covers all six categories", () => {
    const source = src(BADGE_MAP_FILES[1]);
    for (const category of [
      "achievement",
      "service",
      "leadership",
      "innovation",
      "scholarship",
      "lifetime_achievement",
    ]) {
      expect(source).toMatch(new RegExp(`${category}:\\s*"`));
    }
  });

  test("directory error state delegates to the shared token-based PageErrorState", () => {
    const source = src(BADGE_MAP_FILES[4]);
    // The hand-rolled destructive box was replaced by the shared state
    // component, which renders Alert variant="destructive" (token-based).
    expect(source).toContain("PageErrorState");
    expect(source).not.toMatch(/red-50\b/);
    expect(source).not.toMatch(/red-200\b/);
    expect(source).toContain("Failed to load membership directory. Please try again later.");
  });
});

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) files.push(...walk(path));
    else if (/\.(ts|tsx|js|jsx|css)$/.test(entry)) files.push(path);
  }
  return files;
}

// ---------------------------------------------------------------------------
// (d) No broken hsl(var(--...)) wrappers anywhere in src/
// ---------------------------------------------------------------------------

describe("no broken hsl(var(--...)) wrappers", () => {
  test("zero hsl(var(-- occurrences in src/", () => {
    const offenders = walk(join(ROOT, "src")).filter((path) =>
      readFileSync(path, "utf8").includes("hsl(var(--"),
    );
    expect(offenders).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// (e) Dark block shadow + duplication hygiene
// ---------------------------------------------------------------------------

describe("dark block hygiene", () => {
  test("no alpha-zero `/ 0)` shadow entries", () => {
    expect(DARK_BLOCK).not.toMatch(/\/\s*0\)/);
  });

  test("--shadow-opacity is a real (non-zero) value", () => {
    const value = declaration(DARK_BLOCK, "shadow-opacity");
    expect(value).toBeDefined();
    expect(Number(value)).toBeGreaterThan(0);
  });

  const SHADOW_SCALE = [
    "shadow-2xs",
    "shadow-xs",
    "shadow-sm",
    "shadow",
    "shadow-md",
    "shadow-lg",
    "shadow-xl",
    "shadow-2xl",
  ];

  for (const name of SHADOW_SCALE) {
    test(`--${name} is authored in the dark block with the 0px/4px offset`, () => {
      const value = declaration(DARK_BLOCK, name);
      expect(value, `--${name} in dark block`).toBeDefined();
      expect(value).toMatch(/^0px 4px 0px 0px hsl\(0 0% 0% \/ [\d.]+\)/);
    });
  }

  test("no duplicate --font-* / --radius re-declarations", () => {
    for (const name of ["font-sans", "font-serif", "font-mono", "radius"]) {
      expect(DARK_BLOCK).not.toContain(`--${name}:`);
    }
  });
});

// ---------------------------------------------------------------------------
// (f) Wave 2: centralized badge maps (deferred set)
// ---------------------------------------------------------------------------

const BADGE_MAP_FILES_WAVE2 = [
  "src/app/dashboard/jobs/page.tsx",
  "src/app/dashboard/profile/components/session-manager/session-card.tsx",
  "src/app/dashboard/organization/committees/[id]/_components/committee-helpers.tsx",
  "src/components/committees/committees-table/committee-badges.tsx",
  "src/components/workspaces/workspaces-table/workspace-badges.tsx",
  "src/components/users/user-detail-modal/helpers.ts",
  "src/components/content/media-permissions-manager/helpers.tsx",
  "src/lib/utils/event-utils.ts",
];

// Any raw Tailwind palette class with a numbered stop (bg-/text-/border-...).
const RAW_PALETTE =
  /\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

describe("wave-2 badge maps migrated off raw palette", () => {
  for (const file of BADGE_MAP_FILES_WAVE2) {
    const source = src(file);

    test(`${file}: zero raw palette classes`, () => {
      const offenders = source.match(RAW_PALETTE);
      expect(offenders, `${file} palette classes`).toBeNull();
    });

    test(`${file}: zero -100 text-*-800 palette pairs`, () => {
      expect(source).not.toMatch(/-100\s+text-[a-z]+-800/);
    });

    test(`${file}: no palette dark: overrides (tokens adapt per theme)`, () => {
      expect(source).not.toMatch(/dark:(bg|text|border)-[a-z]+-\d{2,3}\b/);
    });
  }

  test("dead event-styles.ts is deleted (it had zero importers)", () => {
    expect(() => src("src/lib/styles/event-styles.ts")).toThrow();
  });

  test("no -100 text-*-800 badge pairs remain anywhere in src/", () => {
    const offenders = walk(join(ROOT, "src")).filter((path) =>
      /-100\s+text-[a-z]+-800/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  test("jobs status map keeps every status on token classes", () => {
    const source = src(BADGE_MAP_FILES_WAVE2[0]);
    const start = source.indexOf("STATUS_BADGE_STYLES");
    const map = source.slice(start, source.indexOf("};", start) + 2);
    for (const status of ["DRAFT", "PUBLISHED", "ARCHIVED", "CLOSED", "FILLED", "CANCELLED"]) {
      expect(map, `STATUS_BADGE_STYLES covers ${status}`).toMatch(new RegExp(`${status}:\\s*"`));
    }
    expect(map).toContain("text-warning");
    expect(map).toContain("text-success");
    expect(map).toContain("text-info");
    expect(map).toContain("text-destructive");
    expect(map).toContain("bg-muted");
  });

  test("session-card chrome and badges use success tokens", () => {
    const source = src(BADGE_MAP_FILES_WAVE2[1]);
    expect(source).toContain("border-success/30");
    expect(source).toContain("bg-success/10");
    expect(source).toContain("text-success");
    expect(source).toContain("This Device");
    expect(source).toContain("Active");
  });

  test("committee type maps keep all five types in both copies", () => {
    for (const file of [BADGE_MAP_FILES_WAVE2[2], BADGE_MAP_FILES_WAVE2[3]]) {
      const source = src(file);
      for (const type of ["executive", "functional", "special_interest", "ad_hoc", "standing"]) {
        expect(source, `${file} covers ${type}`).toMatch(new RegExp(`${type}:\\s*"`));
      }
    }
  });

  test("workspace type map keeps all five types", () => {
    const source = src(BADGE_MAP_FILES_WAVE2[4]);
    for (const type of ["general", "project", "document", "discussion", "meeting"]) {
      expect(source).toMatch(new RegExp(`${type}:\\s*"`));
    }
  });

  test("user-detail maps keep every status/auth/role key", () => {
    const source = src(BADGE_MAP_FILES_WAVE2[5]);
    for (const key of [
      "UserStatus.ACTIVE",
      "UserStatus.INACTIVE",
      "UserStatus.SUSPENDED",
      "UserStatus.PENDING_VERIFICATION",
      "UserStatus.BANNED",
      "AuthStatus.VERIFIED",
      "AuthStatus.UNVERIFIED",
      "AuthStatus.TWO_FACTOR_ENABLED",
      "AuthStatus.TWO_FACTOR_DISABLED",
      '"admin"',
      '"moderator"',
      '"member"',
    ]) {
      expect(source, `user-detail helpers cover ${key}`).toContain(key);
    }
  });

  test("permission map keeps all five capabilities", () => {
    const source = src(BADGE_MAP_FILES_WAVE2[6]);
    for (const permission of ["view", "download", "edit", "delete", "share"]) {
      expect(source).toMatch(new RegExp(`case "${permission}"`));
    }
    expect(source).toContain("getPermissionColor");
  });

  test("event-utils keeps both color getters with every key", () => {
    const source = src(BADGE_MAP_FILES_WAVE2[7]);
    expect(source).toContain("export function getEventTypeColor");
    expect(source).toContain("export function getEventStatusColor");
    for (const key of [
      "EventType.WORKSHOP",
      "EventType.MEETUP",
      "EventType.CONFERENCE",
      "EventType.WEBINAR",
      "EventType.SOCIAL",
      "EventType.TRAINING",
      "EventStatus.DRAFT",
      "EventStatus.PUBLISHED",
      "EventStatus.CANCELLED",
      "EventStatus.COMPLETED",
    ]) {
      expect(source, `event-utils covers ${key}`).toContain(key);
    }
  });
});

// ---------------------------------------------------------------------------
// (g) Wave 3: membership tier map + transactional email templates
// ---------------------------------------------------------------------------

const BADGE_MAP_FILES_WAVE3 = [
  "src/components/memberships/member-card.tsx",
  "src/components/email-template/welcome.tsx",
  "src/components/email-template/email-verification.tsx",
  "src/components/email-template/password-reset.tsx",
];

describe("wave-3 tier map and email templates migrated off raw palette", () => {
  for (const file of BADGE_MAP_FILES_WAVE3) {
    const source = src(file);

    test(`${file}: zero raw palette classes`, () => {
      const offenders = source.match(RAW_PALETTE);
      expect(offenders, `${file} palette classes`).toBeNull();
    });

    test(`${file}: zero -100 text-*-800 palette pairs`, () => {
      expect(source).not.toMatch(/-100\s+text-[a-z]+-800/);
    });

    test(`${file}: no palette dark: overrides (tokens adapt per theme)`, () => {
      expect(source).not.toMatch(/dark:(bg|text|border)-[a-z]+-\d{2,3}\b/);
    });
  }

  test("member-card keeps every tier/status key on token classes", () => {
    const source = src(BADGE_MAP_FILES_WAVE3[0]);
    // The directory-card redesign replaced the switch color maps with Record
    // lookups and retired the border-l tier accent (the avatar status dot and
    // the badges carry tier/status semantics now), so keys are asserted in
    // computed-record form instead of `case MembershipTier.X:` lines.
    for (const tier of ["BASIC", "STUDENT", "PROFESSIONAL", "CORPORATE", "PREMIUM", "VIP"]) {
      expect(source, `member-card tier ${tier}`).toContain(`[MembershipTier.${tier}]`);
    }
    for (const status of ["ACTIVE", "EXPIRED", "PENDING", "SUSPENDED", "CANCELLED"]) {
      expect(source, `member-card status ${status}`).toContain(`[MembershipStatus.${status}]`);
    }
    expect(source).toContain("bg-success");
    expect(source).toContain("text-info");
    expect(source).toContain("bg-warning/15");
  });

  test("email templates wire the shared email theme into <Tailwind>", () => {
    for (const file of BADGE_MAP_FILES_WAVE3.slice(1)) {
      const source = src(file);
      expect(source, `${file} imports the email theme`).toContain('from "./email-theme"');
      expect(source, `${file} passes the config`).toMatch(/<Tailwind\s+config=\{/);
    }
  });

  test("shared email footer stays on the email theme", () => {
    const source = src("src/components/email-template/shared-footer.tsx");
    expect(source.match(RAW_PALETTE), "shared-footer palette classes").toBeNull();
  });
});

// ---------------------------------------------------------------------------
// (h) Wave 4: user stats, security tab, announcement banner gradients
// ---------------------------------------------------------------------------

const BADGE_MAP_FILES_WAVE4 = [
  "src/components/users/user-stats.tsx",
  "src/components/users/user-detail-modal/security-tab.tsx",
  "src/components/content/announcement-banner.tsx",
];

describe("wave-4 stats, security tab, and banner migrated off raw palette", () => {
  for (const file of BADGE_MAP_FILES_WAVE4) {
    const source = src(file);

    test(`${file}: zero raw palette classes`, () => {
      expect(source.match(RAW_PALETTE), `${file} palette classes`).toBeNull();
    });

    test(`${file}: no palette dark: overrides (tokens adapt per theme)`, () => {
      expect(source).not.toMatch(/dark:(bg|text|border)-[a-z]+-\d{2,3}\b/);
    });
  }

  test("announcement-banner gradient stops use token colors", () => {
    const source = src("src/components/content/announcement-banner.tsx");
    expect(source).not.toMatch(/\b(from|to|via)-[a-z]+-\d{2,3}\b/);
    expect(source).toContain("getBannerColor");
  });
});
