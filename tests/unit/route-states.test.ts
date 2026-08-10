import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * UI-20: route-level states — error boundaries, loading skeletons, and the
 * dashboard client-layout cleanup. Static checks against the source files,
 * in the style of the other tests/ structural suites.
 */

const ROOT = join(import.meta.dir, "..", "..");

function readSource(...parts: string[]): string {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

function sourceExists(...parts: string[]): boolean {
  return existsSync(join(ROOT, ...parts));
}

const GLOBAL_ERROR_FILE = "src/app/global-error.tsx";

const SEGMENT_ERROR_FILES = [
  "src/app/(public)/error.tsx",
  "src/app/auth/error.tsx",
  "src/app/dashboard/error.tsx",
];

const NEW_LOADING_FILES = [
  "src/app/(public)/events/loading.tsx",
  "src/app/(public)/jobs/loading.tsx",
  "src/app/(public)/news/loading.tsx",
  "src/app/dashboard/events/loading.tsx",
  "src/app/dashboard/jobs/loading.tsx",
  "src/app/dashboard/content/media/loading.tsx",
];

const DASHBOARD_CLIENT_LAYOUT = "src/app/dashboard/_components/dashboard-client-layout.tsx";

describe("route-level error boundaries", () => {
  test("all four error files exist", () => {
    expect(sourceExists(GLOBAL_ERROR_FILE)).toBe(true);
    for (const file of SEGMENT_ERROR_FILES) {
      expect(sourceExists(file)).toBe(true);
    }
  });

  test("global-error.tsx is a client component that owns <html> and <body>", () => {
    const source = readSource(GLOBAL_ERROR_FILE);
    expect(source).toContain('"use client"');
    expect(source).toContain("<html");
    expect(source).toContain("</html>");
    expect(source).toContain("<body");
    expect(source).toContain("</body>");
  });

  test("global-error.tsx offers a reload recovery action", () => {
    const source = readSource(GLOBAL_ERROR_FILE);
    expect(source).toContain("window.location.reload()");
  });

  for (const file of SEGMENT_ERROR_FILES) {
    test(`${file} is a client component wired to reset()`, () => {
      const source = readSource(file);
      expect(source).toContain('"use client"');
      expect(source).toContain("reset: () => void");
      expect(source).toContain("onClick={reset}");
    });

    test(`${file} does not render raw error details`, () => {
      const source = readSource(file);
      expect(source.includes("error.message")).toBe(false);
      expect(source.includes("error.stack")).toBe(false);
    });
  }
});

describe("route-level loading skeletons", () => {
  for (const file of NEW_LOADING_FILES) {
    test(`${file} exists and builds on the Skeleton primitive`, () => {
      expect(sourceExists(file)).toBe(true);
      const source = readSource(file);
      expect(source).toContain('from "@/components/ui/skeleton"');
      expect(source).toContain("<Skeleton");
    });

    test(`${file} ships no fake copy`, () => {
      const source = readSource(file);
      // Skeleton bars only — no invented labels or lorem text between tags.
      expect(source.includes("Loading...")).toBe(false);
      expect(source.includes("lorem")).toBe(false);
    });
  }

  test("pre-existing forum/chapter loading files are untouched", () => {
    expect(sourceExists("src/app/(public)/forums/loading.tsx")).toBe(true);
    expect(sourceExists("src/app/(public)/chapters/loading.tsx")).toBe(true);
    expect(sourceExists("src/app/dashboard/loading.tsx")).toBe(true);
  });
});

describe("dashboard client layout cleanup", () => {
  const source = readSource(DASHBOARD_CLIENT_LAYOUT);

  test("no artificial setTimeout header-skeleton delay", () => {
    expect(source.includes("setTimeout")).toBe(false);
    expect(source.includes("isHeaderLoaded")).toBe(false);
  });

  test("dead user/role layout props are gone", () => {
    expect(source.includes("user?")).toBe(false);
    expect(source.includes("role?")).toBe(false);
    expect(source.includes("UserRole")).toBe(false);
    expect(source.includes("void role")).toBe(false);
  });

  test("header renders immediately from the header context", () => {
    expect(source).toContain("useHeader()");
    expect(source).toContain('title={title || "Dashboard"}');
  });
});

describe("dead loading-boundary/page-transition components removed", () => {
  test("loading-boundary.tsx is deleted", () => {
    expect(sourceExists("src/components/dashboard/loading/loading-boundary.tsx")).toBe(false);
  });

  test("page-transition.tsx and the now-empty transition/ dir are deleted", () => {
    expect(sourceExists("src/components/dashboard/transition/page-transition.tsx")).toBe(false);
    expect(sourceExists("src/components/dashboard/transition")).toBe(false);
  });

  test("the dashboard content skeleton (still used by dashboard/loading.tsx) survives", () => {
    expect(sourceExists("src/components/dashboard/loading/dashboard-content-skeleton.tsx")).toBe(
      true,
    );
  });
});
