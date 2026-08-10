import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { navigationData, type NavItemData } from "@/lib/navigation-data";

const APP_DIR = join(import.meta.dir, "..", "..", "src", "app");

// Route groups (e.g. "(public)") add URL-neutral segments, so a leaf path
// like "/forums" may resolve under "src/app/(public)/forums/page.tsx".
const ROUTE_GROUPS = readdirSync(APP_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("("))
  .map((entry) => entry.name);

function pageExists(navPath: string): boolean {
  const segment = navPath.replace(/^\//, "");
  return ["", ...ROUTE_GROUPS].some((group) =>
    existsSync(join(APP_DIR, group, segment, "page.tsx")),
  );
}

// A parent item with subItems renders as a collapsible trigger
// (navigation-item.tsx) — it only expands/collapses, and its `path` is
// used solely for isActive() auto-expand matching. It's never rendered as
// a real <Link>, so it doesn't need a page.tsx. Only leaf items (no
// subItems) are actually clickable.
function collectLeafPaths(items: readonly NavItemData[], acc: string[] = []): string[] {
  for (const item of items) {
    if (item.subItems && item.subItems.length > 0) {
      collectLeafPaths(item.subItems, acc);
    } else {
      acc.push(item.path);
    }
  }
  return acc;
}

describe("navigation-data.ts leaf links", () => {
  const leafPaths = [...new Set(collectLeafPaths(navigationData))];

  test("has at least one leaf path to check (sanity check for the test itself)", () => {
    expect(leafPaths.length).toBeGreaterThan(10);
  });

  for (const path of leafPaths) {
    test(`${path} resolves to a real page.tsx`, () => {
      expect(pageExists(path)).toBe(true);
    });
  }
});
