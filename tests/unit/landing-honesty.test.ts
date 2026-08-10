/**
 * Landing honesty guards: UI-38 promotion pass + UI-25 module-claim
 * honesty (docs/planning/03-frontend-improvement-plan.md, decision R5).
 *
 * The landing may only claim module exposure that is derived from the
 * maturity registry in config/features.ts: a module appears as live only
 * while its flag is on, and as upcoming only while its flag is off. No
 * hard-coded social-proof numbers (stars, instance counts, adoption
 * claims) and no hand-written module counts survive in landing copy.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import {
  MODULE_FLAGS,
  MODULE_LABELS,
  MODULE_NAMES,
  getDisabledModules,
  getEnabledModules,
  type ModuleName,
} from "../../config/features";
import * as landing from "../../src/app/_components/landing-data";

const ROOT = join(import.meta.dir, "..", "..");
const LANDING_DIR = join(ROOT, "src", "app", "_components");
const APP_DIR = join(ROOT, "src", "app");

const landingDataSource = readFileSync(join(LANDING_DIR, "landing-data.ts"), "utf8");

describe("landing module claims derive from the maturity registry (UI-25, decision R5)", () => {
  test("LIVE_MODULES matches the enabled modules in config/features.ts", () => {
    expect([...landing.LIVE_MODULES]).toEqual(
      getEnabledModules().map((name) => MODULE_LABELS[name]),
    );
  });

  test("ROADMAP_MODULES matches the disabled modules in config/features.ts", () => {
    expect([...landing.ROADMAP_MODULES]).toEqual(
      getDisabledModules().map((name) => MODULE_LABELS[name]),
    );
  });

  test("every registry module appears exactly once across the two lists", () => {
    const combined = [...landing.LIVE_MODULES, ...landing.ROADMAP_MODULES];
    expect(combined).toHaveLength(MODULE_NAMES.length);
    expect(new Set(combined).size).toBe(MODULE_NAMES.length);
    for (const name of MODULE_NAMES) {
      expect(combined).toContain(MODULE_LABELS[name]);
    }
  });

  test("landing-data exposes a flag-driven derivation, not hand-edited copy", () => {
    expect(typeof landing.deriveModuleLists).toBe("function");
  });

  test("derivation follows synthetic flags: upcoming only when the flag says so", () => {
    expect(typeof landing.deriveModuleLists).toBe("function");
    const flags: Record<ModuleName, boolean> = { ...MODULE_FLAGS };
    for (const name of MODULE_NAMES) {
      flags[name] = name === "members" || name === "events";
    }
    const derived = landing.deriveModuleLists(flags);
    expect(derived.live).toEqual([MODULE_LABELS.members, MODULE_LABELS.events]);
    expect(derived.upcoming).toEqual(
      MODULE_NAMES.filter((name) => name !== "members" && name !== "events").map(
        (name) => MODULE_LABELS[name],
      ),
    );
    expect(derived.upcoming).not.toContain(MODULE_LABELS.members);
  });
});

describe("no hard-coded social proof in the landing (UI-38)", () => {
  test("landing-data.ts declares no count-style identifiers", () => {
    expect(landingDataSource).not.toMatch(
      /\b(stars?|forks?|watchers?|instances?|deployments?|customers?|organizations?|users?|signups?)_(count|total|number)\b/i,
    );
  });

  test("landing-data.ts exports no bare numeric constants", () => {
    expect(landingDataSource).not.toMatch(/export\s+const\s+\w+\s*=\s*\d/);
  });

  test("no landing copy claims stars, instance, or adoption counts", () => {
    const claim =
      /\b\d+\s*\+?\s*(stars?|forks?|instances?|deployments?|organizations?|users?|teams?|communities?)\b/i;
    for (const file of readdirSync(LANDING_DIR)) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const source = readFileSync(join(LANDING_DIR, file), "utf8");
      expect(source).not.toMatch(claim);
    }
  });

  test("no landing copy hard-codes a module count in prose", () => {
    const count =
      /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|\d+)\s+(\w+\s+){0,2}modules?\b/i;
    for (const file of readdirSync(LANDING_DIR)) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;
      const source = readFileSync(join(LANDING_DIR, file), "utf8");
      expect(source).not.toMatch(count);
    }
  });
});

describe("footer surfaces the live public pages (UI-38)", () => {
  const SURFACES = ["/news", "/forums", "/members", "/membership", "/chapters", "/committees"];

  // Route groups such as "(public)" add URL-neutral segments, mirroring
  // the resolution used by tests/nav-links.test.ts.
  const routeGroups = readdirSync(APP_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("("))
    .map((entry) => entry.name);

  function pageExists(route: string): boolean {
    const segment = route.replace(/^\//, "");
    return ["", ...routeGroups].some((group) =>
      existsSync(join(APP_DIR, group, segment, "page.tsx")),
    );
  }

  const footerSource = readFileSync(join(LANDING_DIR, "site-footer.tsx"), "utf8");

  for (const surface of SURFACES) {
    test(`${surface} resolves to a real page.tsx`, () => {
      expect(pageExists(surface)).toBe(true);
    });
    test(`footer links to ${surface}`, () => {
      expect(footerSource).toContain(`href="${surface}"`);
    });
  }
});

describe("closing CTA splits the two intents (UI-38)", () => {
  const ctaSource = readFileSync(join(LANDING_DIR, "cta-section.tsx"), "utf8");

  test("offers creating an account on this instance", () => {
    expect(ctaSource).toContain('href="/auth/signup"');
  });

  test("offers self-hosting and targets the QUICK_START card", () => {
    expect(ctaSource).toMatch(/#quick-start/);
    const contributeSource = readFileSync(join(LANDING_DIR, "contribute-section.tsx"), "utf8");
    expect(contributeSource).toContain('id="quick-start"');
  });
});
