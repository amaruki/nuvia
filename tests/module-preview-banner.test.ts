/**
 * Phase 8 guardrail item 3 — mock labeling
 * (docs/planning/03-frontend-improvement-plan.md §9.3).
 *
 * ModulePreviewBanner is the one shared mock-tier mark (ADR-0008): a page
 * behind a flag-off MODULE_FLAGS entry renders it, and the banner removes
 * itself the moment the flag flips on at promotion. Every flag in the
 * registry is on today, so the flag-off branch is unreachable through the
 * global registry — the banner therefore accepts an optional `flags`
 * override that threads through to isModuleEnabled(module, flags), letting
 * callers (and these tests) exercise on/off behavior without mutating
 * MODULE_FLAGS. Omitting the prop must keep today's behavior.
 *
 * Rendering goes through react-dom/server's renderToStaticMarkup: the
 * banner must stay server-compatible (no hooks, no client state) so section
 * layouts can remain server components, and static markup proves exactly
 * that — a hook would throw here.
 */
import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MODULE_FLAGS, MODULE_LABELS, MODULE_NAMES, type ModuleName } from "../config/features";
import { ModulePreviewBanner } from "../src/components/dashboard/module-preview-banner";

/** Labels pass through HTML escaping in static markup (& becomes &amp;). */
function asHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function renderBanner(module: ModuleName, flags?: Record<ModuleName, boolean>): string {
  return renderToStaticMarkup(createElement(ModulePreviewBanner, { module, flags }));
}

/** Synthetic all-on flag set: the registry shape once every module is promoted. */
const ALL_ON = Object.fromEntries(MODULE_NAMES.map((name) => [name, true])) as Record<
  ModuleName,
  boolean
>;

/** Turn exactly one module off against a copy of the registry. */
function allBut(module: ModuleName): Record<ModuleName, boolean> {
  return { ...MODULE_FLAGS, [module]: false };
}

describe("ModulePreviewBanner, flag on: the banner is inert", () => {
  test("renders nothing for any module when every flag is on", () => {
    for (const module of MODULE_NAMES) {
      expect(renderBanner(module, ALL_ON)).toBe("");
    }
  });

  test("omitting flags falls back to the global registry (backwards compatible)", () => {
    for (const module of MODULE_NAMES) {
      expect(renderBanner(module)).toBe(renderBanner(module, MODULE_FLAGS));
    }
  });
});

describe("ModulePreviewBanner, flag off: honest preview labeling", () => {
  test("a flags override turning the module off renders the labeled banner", () => {
    const html = renderBanner("events", allBut("events"));

    expect(html).toContain('data-testid="module-preview-banner"');
    expect(html).toContain('data-module="events"');
    // The module label names which module is preview-tier.
    expect(html).toContain(
      `${asHtml(MODULE_LABELS.events)} has not cleared the module promotion gate`,
    );
    // Honest preview wording: says preview, says mock data, says nothing is
    // saved — never presents the mock surface as the real module.
    expect(html).toContain("Preview");
    expect(html).toContain("mock data");
    expect(html).toContain("nothing is saved");
    expect(html).toContain("ADR-0008");
  });

  test("every module renders a labeled banner when its flag is forced off", () => {
    for (const module of MODULE_NAMES) {
      const html = renderBanner(module, allBut(module));

      expect(html).toContain('data-testid="module-preview-banner"');
      expect(html).toContain(`data-module="${module}"`);
      expect(html).toContain(asHtml(MODULE_LABELS[module]));
      expect(html).toContain("mock data");
    }
  });

  test("the flag-off branch never leaks when the override says on", () => {
    for (const module of MODULE_NAMES) {
      expect(renderBanner(module, { ...allBut(module), [module]: true })).toBe("");
    }
  });
});
