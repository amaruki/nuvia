import { describe, expect, test } from "bun:test";
import {
  MODULE_FLAGS,
  MODULE_LABELS,
  MODULE_NAMES,
  getDisabledModules,
  getEnabledModules,
  getModuleForPath,
  isMockMarked,
  isModuleEnabled,
  type ModuleName,
} from "../config/features";

// The two module sets ADR-0008 / docs/technical-specs/13-module-maturity-gate.md
// §13.3 fixes: promoted modules ship enabled, Mock-tier modules stay off
// until they clear the promotion bar. Finance joined the promoted set on
// 2026-08-08 (backlog C5) and chapters on 2026-08-08 (backlog D1); the
// remaining four stay Mock tier.
const PROMOTED: readonly ModuleName[] = [
  "members",
  "events",
  "content",
  "forums",
  "jobs",
  "finance",
  "chapters",
];
const MOCK_TIER: readonly ModuleName[] = ["awards", "learning", "committees", "workspaces"];

describe("MODULE_FLAGS registry (§13.3 shape)", () => {
  test("covers exactly the eleven known modules, no more and no fewer", () => {
    expect([...MODULE_NAMES].sort()).toEqual([...PROMOTED, ...MOCK_TIER].sort() as ModuleName[]);
    expect(Object.keys(MODULE_FLAGS).sort()).toEqual([...MODULE_NAMES].sort());
  });

  test("every flag is a boolean — no undefined entries in the Record", () => {
    for (const name of MODULE_NAMES) {
      expect(typeof MODULE_FLAGS[name]).toBe("boolean");
    }
  });

  test("promoted modules are on", () => {
    for (const name of PROMOTED) {
      expect(MODULE_FLAGS[name]).toBe(true);
    }
  });

  test("mock-tier modules are off", () => {
    for (const name of MOCK_TIER) {
      expect(MODULE_FLAGS[name]).toBe(false);
    }
  });

  test("every module has a human-readable label for UI marks", () => {
    for (const name of MODULE_NAMES) {
      expect(MODULE_LABELS[name].length).toBeGreaterThan(0);
    }
  });
});

describe("isModuleEnabled (flag on/off behavior)", () => {
  for (const name of PROMOTED) {
    test(`${name} is enabled`, () => {
      expect(isModuleEnabled(name)).toBe(true);
    });
  }

  for (const name of MOCK_TIER) {
    test(`${name} is disabled`, () => {
      expect(isModuleEnabled(name)).toBe(false);
    });
  }

  test("a promotion flip turns a module on without touching the registry", () => {
    const promoted: Record<ModuleName, boolean> = { ...MODULE_FLAGS, awards: true };
    expect(isModuleEnabled("awards", promoted)).toBe(true);
    // The registry itself is untouched.
    expect(isModuleEnabled("awards")).toBe(false);
  });

  test("an all-off override disables every module", () => {
    const allOff = Object.fromEntries(MODULE_NAMES.map((name) => [name, false])) as Record<
      ModuleName,
      boolean
    >;
    for (const name of MODULE_NAMES) {
      expect(isModuleEnabled(name, allOff)).toBe(false);
    }
  });
});

describe("getEnabledModules / getDisabledModules (enabled set)", () => {
  test("the registry partitions into the promoted and mock-tier sets", () => {
    expect(getEnabledModules()).toEqual([...PROMOTED]);
    expect(getDisabledModules()).toEqual([...MOCK_TIER]);
  });

  test("the partition follows flag overrides", () => {
    const promoted: Record<ModuleName, boolean> = { ...MODULE_FLAGS, awards: true };
    // MODULE_NAMES order: awards sorts before chapters.
    expect(getEnabledModules(promoted)).toEqual([
      "members",
      "events",
      "content",
      "forums",
      "jobs",
      "finance",
      "awards",
      "chapters",
    ]);
    expect(getDisabledModules(promoted)).toEqual(MOCK_TIER.filter((m) => m !== "awards"));
  });

  test("an all-on override enables every module", () => {
    const allOn = Object.fromEntries(MODULE_NAMES.map((name) => [name, true])) as Record<
      ModuleName,
      boolean
    >;
    expect(getEnabledModules(allOn)).toEqual([...MODULE_NAMES]);
    expect(getDisabledModules(allOn)).toEqual([]);
  });
});

describe("isMockMarked (mock-marking predicate)", () => {
  for (const name of MOCK_TIER) {
    test(`${name} must carry the mock mark while its flag is off`, () => {
      expect(isMockMarked(name)).toBe(true);
    });
  }

  for (const name of PROMOTED) {
    test(`${name} carries no mock mark`, () => {
      expect(isMockMarked(name)).toBe(false);
    });
  }

  test("promotion clears the mock mark", () => {
    const promoted: Record<ModuleName, boolean> = { ...MODULE_FLAGS, awards: true };
    expect(isMockMarked("awards", promoted)).toBe(false);
  });

  test("today flag-off and mock-marked coincide for every module", () => {
    // Holds while every flag-off module is still Mock tier (finance reached
    // Promoted in backlog C5, so it is flag-on and unmarked); when a flag-off
    // module reaches Backed, this equivalence is the tripwire that says
    // isMockMarked needs a tier lookup of its own.
    for (const name of MODULE_NAMES) {
      expect(isMockMarked(name)).toBe(!isModuleEnabled(name));
    }
  });
});

describe("getModuleForPath (nav-section → module mapping)", () => {
  test("finance section maps to finance, including subpages", () => {
    expect(getModuleForPath("/dashboard/finance")).toBe("finance");
    expect(getModuleForPath("/dashboard/finance/budget")).toBe("finance");
    expect(getModuleForPath("/dashboard/finance/reports/123")).toBe("finance");
  });

  test("awards and learning sections map to their modules", () => {
    expect(getModuleForPath("/dashboard/awards")).toBe("awards");
    expect(getModuleForPath("/dashboard/awards/programs")).toBe("awards");
    expect(getModuleForPath("/dashboard/learning")).toBe("learning");
    expect(getModuleForPath("/dashboard/learning/courses")).toBe("learning");
  });

  test("organization-structure entries map to chapters/committees/workspaces", () => {
    expect(getModuleForPath("/dashboard/organization/chapters")).toBe("chapters");
    expect(getModuleForPath("/dashboard/organization/chapters/abc")).toBe("chapters");
    expect(getModuleForPath("/dashboard/organization/committees")).toBe("committees");
    expect(getModuleForPath("/dashboard/organization/workspaces")).toBe("workspaces");
    expect(getModuleForPath("/dashboard/organization/workspaces/xyz")).toBe("workspaces");
  });

  test("committee budget management maps to finance", () => {
    expect(getModuleForPath("/dashboard/organization/budget")).toBe("finance");
  });

  test("the five promoted sections still map to their modules", () => {
    expect(getModuleForPath("/dashboard/memberships")).toBe("members");
    expect(getModuleForPath("/dashboard/events")).toBe("events");
    expect(getModuleForPath("/dashboard/content/articles")).toBe("content");
    expect(getModuleForPath("/dashboard/forums")).toBe("forums");
    expect(getModuleForPath("/dashboard/jobs")).toBe("jobs");
  });

  test("non-module dashboard paths are never gated", () => {
    expect(getModuleForPath("/dashboard")).toBeNull();
    expect(getModuleForPath("/dashboard/users")).toBeNull();
    expect(getModuleForPath("/dashboard/communications")).toBeNull();
    expect(getModuleForPath("/dashboard/analytics")).toBeNull();
    expect(getModuleForPath("/dashboard/settings/payments")).toBeNull();
    expect(getModuleForPath("/dashboard/profile")).toBeNull();
    expect(getModuleForPath("/dashboard/organization")).toBeNull();
    expect(getModuleForPath("/somewhere/else")).toBeNull();
  });

  test("analytics paths must not leak into module matches", () => {
    // /dashboard/analytics/events and /dashboard/analytics/financial look
    // module-adjacent but belong to the ungated analytics section.
    expect(getModuleForPath("/dashboard/analytics/events")).toBeNull();
    expect(getModuleForPath("/dashboard/analytics/financial")).toBeNull();
  });

  test("matching respects path-segment boundaries", () => {
    expect(getModuleForPath("/dashboard/financeextra")).toBeNull();
    expect(getModuleForPath("/dashboard/jobsfair")).toBeNull();
    expect(getModuleForPath("/dashboard/event")).toBeNull();
  });

  test("every module is reachable through the path mapping", () => {
    const representativePaths: Record<ModuleName, string> = {
      members: "/dashboard/memberships",
      events: "/dashboard/events",
      content: "/dashboard/content",
      forums: "/dashboard/forums",
      jobs: "/dashboard/jobs",
      finance: "/dashboard/finance",
      awards: "/dashboard/awards",
      learning: "/dashboard/learning",
      chapters: "/dashboard/organization/chapters",
      committees: "/dashboard/organization/committees",
      workspaces: "/dashboard/organization/workspaces",
    };
    for (const name of MODULE_NAMES) {
      expect(getModuleForPath(representativePaths[name])).toBe(name);
    }
  });
});
