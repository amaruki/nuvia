/**
 * UI-11 guard (docs/planning/03-frontend-improvement-plan.md, Phase 4):
 * the accessibility fixes the automated axe gate cannot catch.
 *
 *  - WCAG 2.4.1 skip-to-content link: the root layout owns the link and it
 *    is the first tab stop; every route group's <main> carries the matching
 *    id="main-content" target.
 *  - Chart a11y stopgap: hand-built div bars expose progressbar semantics
 *    with explicit values and accessible names until shadcn chart lands
 *    (plan decision D5); no undefined --purple-500 / purple-* palette
 *    leftovers remain in the dashboard widgets.
 *  - Navigation badges: no sub-11px text, and the notification badge uses
 *    the destructive token instead of hardcoded bg-red-500 text-white.
 *  - Calendar views: text-[10px] raised to >=11px except the documented
 *    day-of-week header exception in year view (Phase 4 acceptance rule:
 *    "zero text-[10px] outside calendar day-of-week headers (if kept,
 *    documented)").
 *
 * The scanner strips comments but KEEPS string-literal contents, because the
 * patterns under test live inside className/attribute strings.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/**
 * Blank out `//` and block comments (newlines preserved so positions stay
 * stable) while leaving string and template-literal contents intact — the
 * opposite bias of no-native-dialogs' stripCommentsAndStrings, because
 * className values are exactly what these assertions scan.
 */
export function stripCommentsOnly(source: string): string {
  let out = "";
  let mode: "code" | "line" | "block" | "single" | "double" | "template" = "code";
  // Brace depth recorded when each open `${` was entered, so the matching `}`
  // can return us to the surrounding template literal.
  const templateStack: number[] = [];
  let braceDepth = 0;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line";
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block";
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "single";
      } else if (ch === '"') {
        mode = "double";
      } else if (ch === "`") {
        mode = "template";
      } else if (ch === "{") {
        braceDepth += 1;
      } else if (ch === "}") {
        braceDepth -= 1;
        if (templateStack.length > 0 && braceDepth === templateStack[templateStack.length - 1]) {
          templateStack.pop();
          mode = "template";
        }
      }
      out += ch;
      i += 1;
      continue;
    }

    if (mode === "line") {
      if (ch === "\n") {
        mode = "code";
        out += "\n";
      }
      i += 1;
      continue;
    }

    if (mode === "block") {
      if (ch === "*" && next === "/") {
        mode = "code";
        i += 2;
        continue;
      }
      if (ch === "\n") out += "\n";
      i += 1;
      continue;
    }

    if (mode === "single" || mode === "double") {
      const quote = mode === "single" ? "'" : '"';
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      // A newline means an unterminated string; recover instead of swallowing
      // the rest of the file.
      if (ch === quote || ch === "\n") mode = "code";
      i += 1;
      continue;
    }

    // mode === "template"
    out += ch;
    if (ch === "\\") {
      out += next ?? "";
      i += 2;
      continue;
    }
    if (ch === "`") {
      mode = "code";
      i += 1;
      continue;
    }
    if (ch === "$" && next === "{") {
      templateStack.push(braceDepth);
      braceDepth += 1;
      mode = "code";
      out += next;
      i += 2;
      continue;
    }
    i += 1;
  }

  return out;
}

/** Opening tags of hand-built bars that declare progressbar semantics. */
function progressbarTags(code: string): string[] {
  return [...code.matchAll(/<div[^>]*role="progressbar"[^>]*>/g)].map((m) => m[0]);
}

/** Every progressbar must carry its full value contract and a name. */
function expectCompleteProgressbars(code: string, expectedCount: number): void {
  const bars = progressbarTags(code);
  expect(bars.length).toBe(expectedCount);
  for (const tag of bars) {
    expect(tag).toMatch(/aria-valuenow=\{/);
    expect(tag).toMatch(/aria-valuemin=\{0\}/);
    expect(tag).toMatch(/aria-valuemax=\{100\}/);
    expect(tag).toMatch(/aria-label=/);
  }
}

describe("UI-11 (WCAG 2.4.1): skip-to-content link", () => {
  test("root layout renders a skip link targeting #main-content, hidden until focused", () => {
    const code = stripCommentsOnly(read("src/app/layout.tsx"));
    expect(code).toMatch(/<a[^>]*href="#main-content"/);
    // Visually hidden until focused, then rendered as a real control.
    expect(code).toMatch(/sr-only/);
    expect(code).toMatch(/focus:not-sr-only/);
  });

  test("skip link is the first tab stop (before any routed content)", () => {
    const code = stripCommentsOnly(read("src/app/layout.tsx"));
    const linkAt = code.indexOf('href="#main-content"');
    const childrenAt = code.indexOf("{children}");
    expect(linkAt).toBeGreaterThan(-1);
    expect(childrenAt).toBeGreaterThan(-1);
    expect(linkAt).toBeLessThan(childrenAt);
  });

  test("dashboard main carries the skip target id", () => {
    const code = stripCommentsOnly(
      read("src/app/dashboard/_components/dashboard-client-layout.tsx"),
    );
    expect(code).toMatch(/<main[^>]*id="main-content"/);
  });

  test("public route groups that render a <main> share the same target id", () => {
    // Landing page.
    expect(stripCommentsOnly(read("src/app/page.tsx"))).toMatch(/<main[^>]*id="main-content"/);
    // Shared wrapper for the (public) list pages: events, members,
    // certificates, event dashboard.
    expect(stripCommentsOnly(read("src/components/events/event-list-layout.tsx"))).toMatch(
      /<main[^>]*id="main-content"/,
    );
    // Dev-only design preview keeps the contract consistent.
    expect(stripCommentsOnly(read("src/app/design/preview/page.tsx"))).toMatch(
      /<main[^>]*id="main-content"/,
    );
  });
});

describe("UI-11: chart a11y stopgap", () => {
  test("member-statistics div bars are progressbars with values and names", () => {
    const code = stripCommentsOnly(
      read("src/components/dashboard/widgets/member-statistics-widget.tsx"),
    );
    // Three part-to-whole percentage bars: active, new this month, expired.
    expectCompleteProgressbars(code, 3);
    // Every percentage-width fill is accounted for by a progressbar track.
    expect((code.match(/width:\s*`\$\{[A-Za-z]+\}%`/g) ?? []).length).toBe(3);
  });

  test("analytics widget ships no unsemantized hand-built bars", () => {
    const code = stripCommentsOnly(read("src/components/dashboard/widgets/analytics-widget.tsx"));
    // UI-01 removed the hardcoded bar charts; if bars ever return they must
    // carry full progressbar semantics (asserted here so the guard bites).
    expect((code.match(/width:\s*`\$\{/g) ?? []).length).toBe(progressbarTags(code).length);
    expectCompleteProgressbars(code, progressbarTags(code).length);
    expect(code).toMatch(/EmptyState/);
  });

  test("widgets contain no undefined --purple-500 vars or purple-* classes", () => {
    for (const rel of [
      "src/components/dashboard/widgets/member-statistics-widget.tsx",
      "src/components/dashboard/widgets/analytics-widget.tsx",
    ]) {
      expect(stripCommentsOnly(read(rel))).not.toMatch(/purple/i);
    }
  });

  test("member-statistics colors come from token utilities, not inline var(--…) styles", () => {
    const code = stripCommentsOnly(
      read("src/components/dashboard/widgets/member-statistics-widget.tsx"),
    );
    expect(code).not.toMatch(/style=\{\{[^}]*var\(--/);
  });
});

describe("UI-11: navigation badges", () => {
  test("no sub-11px badge text and no hardcoded red badge remain", () => {
    const code = stripCommentsOnly(read("src/components/dashboard/layout/navigation-item.tsx"));
    expect(code).not.toMatch(/text-\[10px\]/);
    expect(code).not.toMatch(/bg-red-500/);
  });

  test("notification badge uses the destructive token", () => {
    const code = stripCommentsOnly(read("src/components/dashboard/layout/navigation-item.tsx"));
    expect(code).toMatch(/bg-destructive text-destructive-foreground/);
  });
});

describe("UI-11: calendar text sizes", () => {
  test("event-group and month-view raise text-[10px] to >=11px", () => {
    // Both sites are event-time labels, not day-of-week headers, so no
    // exception applies.
    for (const rel of [
      "src/components/ui/full-calendar/event-group.tsx",
      "src/components/ui/full-calendar/month-view.tsx",
    ]) {
      expect(stripCommentsOnly(read(rel))).not.toMatch(/text-\[10px\]/);
    }
  });

  test("year-view keeps text-[10px] only on the documented day-of-week header", () => {
    const raw = read("src/components/ui/full-calendar/year-view.tsx");
    const code = stripCommentsOnly(raw);
    const hits = code.match(/text-\[10px\]/g) ?? [];
    expect(hits.length).toBe(1);
    // The kept site is the documented Phase 4 acceptance exception
    // (day-of-week headers may stay if documented).
    expect(raw).toMatch(/day-of-week header/i);
    expect(raw).toMatch(/UI-11/);
  });
});
