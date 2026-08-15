/**
 * Dashboard form standard ratchets (CODING_STANDARD "Dashboard forms").
 *
 * Two shrinking allowlists guard the migration to URL-driven form sheets:
 *
 * (a) Route shape: CRUD forms live in sheets on the list page, so no new
 *     /create or /edit page routes may appear under the dashboard. Pages
 *     still pending migration are listed in the allowlist; migrating one
 *     means deleting its route and removing the entry here.
 *
 * (b) Schema location: zod form schemas belong in src/lib/validation so
 *     forms and API routes share one source of truth. The allowlist holds
 *     components that still co-locate their schema; moving a schema out
 *     means deleting the file and removing the entry here.
 *
 * Both tests use exact set equality, so the allowlists can only shrink
 * through intentional migration work.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function relativeToRoot(full: string): string {
  return full.slice(ROOT.length + 1).replaceAll("\\", "/");
}

// ---------------------------------------------------------------------------
// (a) Route shape ratchet
// ---------------------------------------------------------------------------

const ALLOWED_CREATE_EDIT_PAGES = [
  "src/app/dashboard/content/announcements/create/page.tsx",
  "src/app/dashboard/content/articles/create/page.tsx",
  "src/app/dashboard/content/publications/create/page.tsx",
  "src/app/dashboard/events/[id]/edit/page.tsx",
  "src/app/dashboard/events/create/page.tsx",
  "src/app/dashboard/jobs/[jobId]/edit/page.tsx",
  "src/app/dashboard/jobs/create/page.tsx",
  "src/app/dashboard/learning/admin/[courseId]/edit/page.tsx",
  "src/app/dashboard/learning/admin/create/page.tsx",
];

describe("dashboard CRUD forms stay on list pages", () => {
  test("no create/edit page routes outside the migration allowlist", () => {
    const pages = walk(join(ROOT, "src", "app", "dashboard"))
      .filter((file) => file.endsWith("page.tsx"))
      .map((file) => {
        const parent = file.split("/").at(-2);
        return parent === "create" || parent === "edit" ? relativeToRoot(file) : null;
      })
      .filter((file): file is string => file !== null)
      .sort();

    expect(pages).toEqual([...ALLOWED_CREATE_EDIT_PAGES].sort());
  });
});

// ---------------------------------------------------------------------------
// (b) Schema location ratchet
// ---------------------------------------------------------------------------

const ALLOWED_COLOCATED_SCHEMAS = [
  "src/app/dashboard/learning/admin/_components/course-form/schema.ts",
  "src/app/dashboard/profile/components/profile-form.tsx",
  "src/app/dashboard/profile/components/social-links-form/validation.ts",
  "src/components/chapters/add-chapter-form/schema.ts",
  "src/components/committees/add-committee-form/schema.ts",
  "src/components/content/add-announcement-form/schema.ts",
  "src/components/content/add-article-form/schema.ts",
  "src/components/content/add-publication-form/schema.ts",
  "src/components/events/event-check-in/types.ts",
  "src/components/events/event-filter/types.ts",
  "src/components/workspaces/add-workspace-form/schema.ts",
];

describe("zod schemas live in src/lib/validation", () => {
  test("no z.object in components or dashboard pages outside the allowlist", () => {
    const offenders = [
      ...walk(join(ROOT, "src", "components")),
      ...walk(join(ROOT, "src", "app", "dashboard")),
    ]
      .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
      .filter((file) => readFileSync(file, "utf8").includes("z.object("))
      .map(relativeToRoot)
      .sort();

    expect(offenders).toEqual([...ALLOWED_COLOCATED_SCHEMAS].sort());
  });
});
