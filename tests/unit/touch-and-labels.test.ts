/**
 * UI-08 guard (docs/planning/03-frontend-improvement-plan.md): touch targets,
 * accessible names for icon-only controls, and honest (non-dead) controls.
 *
 * Structural assertions:
 *  - button.tsx ships 44px touch sizes (`touch` / `icon-touch`).
 *  - Zero deprecated `onKeyPress` handlers remain in src/ (comments and
 *    string literals stripped first, scanner from tests/helpers.ts).
 *  - Every icon-only button owned by UI-08 carries an aria-label (asserted
 *    alongside the icon component so the label stays glued to the control).
 *  - Search inputs are labeled; check-in toggles expose aria-pressed.
 *  - Settings sub-pages each have a real <h1> with no duplicate from the
 *    settings layout.
 *  - Dashboard header contains no inert search/command-menu affordances:
 *    there is no dashboard search route and no command menu, so the dead
 *    controls were removed rather than kept as fake UI.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";

import { collectSourceFiles, stripCommentsAndStrings } from "../helpers";

const ROOT = join(import.meta.dir, "..", "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("UI-08: 44px touch sizes", () => {
  test("button.tsx defines touch and icon-touch sizes at 44px", () => {
    const src = read("src/components/ui/button.tsx");
    expect(src).toMatch(/touch:\s*"h-11 min-w-11"/);
    expect(src).toMatch(/"icon-touch":\s*"size-11"/);
  });

  test("event-list-layout back button uses the 44px icon size", () => {
    const src = read("src/components/events/event-list-layout.tsx");
    expect(src).toContain('size="icon-touch"');
  });
});

describe("UI-08: deprecated onKeyPress is gone from src/", () => {
  test("zero live onKeyPress occurrences", () => {
    const hits: string[] = [];
    for (const file of collectSourceFiles(join(ROOT, "src"))) {
      const stripped = stripCommentsAndStrings(readFileSync(file, "utf8"));
      stripped.split("\n").forEach((line, index) => {
        // `\b` keeps custom props like `onTagKeyPress` out of the match.
        if (/\bonKeyPress\b/.test(line)) {
          hits.push(`${relative(ROOT, file)}:${index + 1}  ${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});

describe("UI-08: icon-only buttons carry accessible names", () => {
  test("event-list-layout: back button labeled, page title is the single h1", () => {
    const src = read("src/components/events/event-list-layout.tsx");
    expect(src).toContain("ArrowLeft");
    expect(src).toContain('aria-label="Back to event list"');
    // Title promoted from h2 to h1.
    expect(src).toMatch(/<h1\b/);
  });

  test("event-certificate: Verify and View details icon buttons labeled", () => {
    const src = read("src/components/events/event-certificate.tsx");
    expect(src).toContain("ExternalLink");
    expect(src).toContain('aria-label="Verify certificate"');
    expect(src).toContain('aria-label="View certificate details"');
  });

  test("tag entry forms: icon-only add/remove buttons labeled", () => {
    const tagForms = [
      "src/app/(public)/events/[id]/edit/_components/tags-section.tsx",
      "src/app/dashboard/events/[id]/edit/_components/tags-section.tsx",
      "src/app/dashboard/events/create/_components/tags-section.tsx",
      "src/app/dashboard/content/media/edit/[id]/_components/tags-card.tsx",
    ];
    for (const rel of tagForms) {
      const src = read(rel);
      expect(src).toContain("Plus");
      expect(src).toContain('aria-label="Add tag"');
      expect(src).toContain("Remove tag");
    }
  });

  test("charter-section and workspace settings-section: icon-only buttons labeled", () => {
    const charter = read("src/components/committees/add-committee-form/charter-section.tsx");
    expect(charter).toContain('aria-label="Add responsibility"');
    expect(charter).toContain("Remove responsibility");

    const workspace = read("src/components/workspaces/add-workspace-form/settings-section.tsx");
    expect(workspace).toContain('aria-label="Add file type"');
    expect(workspace).toContain("Remove file type");
  });
});

describe("UI-08: search inputs labeled, toggles pressed", () => {
  test("registration-search-card: labeled search input, onKeyDown handler", () => {
    const src = read("src/components/events/event-check-in/registration-search-card.tsx");
    expect(src).toContain('aria-label="Search registrations"');
    expect(src).toContain("onKeyDown");
  });

  test("qr-check-in-card: check-in method toggles expose aria-pressed", () => {
    const src = read("src/components/events/event-check-in/qr-check-in-card.tsx");
    expect((src.match(/aria-pressed=/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  test("tag-filter: labeled input with Enter handling on onKeyDown", () => {
    const src = read("src/components/events/event-filter/tag-filter.tsx");
    expect(src).toContain('aria-label="Add a custom tag"');
    expect(src).toContain("onKeyDown");
    expect(src).toContain("e.preventDefault()");
  });

  test("jobs board: search input labeled and still drives the q filter", () => {
    const src = read("src/app/(public)/jobs/page.tsx");
    expect(src).toContain('aria-label="Search jobs"');
    // The input must stay wired to the real server-side filter.
    expect(src).toContain('name="q"');
    expect(src).toContain('action="/jobs"');
  });

  test("member-search keeps its label (regression guard)", () => {
    const src = read("src/app/(public)/members/_components/member-search.tsx");
    expect(src).toContain('htmlFor="member-search"');
    expect(src).toContain('id="member-search"');
  });
});

describe("UI-08: settings tabs have a real h1 without duplicates", () => {
  const subPages = [
    "src/app/dashboard/settings/email/page.tsx",
    "src/app/dashboard/settings/oauth/page.tsx",
    "src/app/dashboard/settings/payments/page.tsx",
    "src/app/dashboard/settings/security/page.tsx",
  ];

  test("every settings sub-page (incl. general) renders an h1", () => {
    for (const rel of [...subPages, "src/app/dashboard/settings/general/page.tsx"]) {
      expect(read(rel)).toMatch(/<h1\b/);
    }
  });

  test("settings layout no longer emits its own h1", () => {
    // The layout wraps every sub-page; an h1 there would duplicate the
    // per-page h1 on all five tabs.
    expect(read("src/app/dashboard/settings/layout.tsx")).not.toMatch(/<h1\b/);
  });

  test("settings index stays a redirect", () => {
    const src = read("src/app/dashboard/settings/page.tsx");
    expect(src).toContain("redirect(");
    expect(src).not.toMatch(/<h1\b/);
  });
});

describe("UI-08: dashboard header has no dead controls", () => {
  test("inert header search component removed", () => {
    expect(
      existsSync(join(ROOT, "src/components/dashboard/layout/dashboard-header/header-search.tsx")),
    ).toBe(false);
  });

  test("dashboard-header no longer references the search affordance", () => {
    const src = read("src/components/dashboard/layout/dashboard-header/dashboard-header.tsx");
    expect(src).not.toContain("HeaderSearch");
    expect(src).not.toContain("showSearch");
    const types = read("src/components/dashboard/layout/dashboard-header/types.ts");
    expect(types).not.toContain("showSearch");
  });
});
