/**
 * UI-21 images & metadata guards (docs/planning/03-frontend-improvement-plan.md).
 *
 * Pins the image-hygiene and link-preview work:
 * - the root layout exports a viewport (light/dark themeColor) and honest
 *   openGraph metadata,
 * - the root route ships a generated opengraph-image,
 * - next.config remotePatterns allow the configured OAuth avatar host,
 * - the owned components render no raw <img> tags (Avatar primitive or
 *   next/image instead),
 * - the auth logo can no longer spill its 48px box,
 * - the event card no longer branches on the nonexistent coverImage column.
 *
 * Source-scanning only, no React is executed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function src(relativePath: string): string {
  expect(existsSync(join(ROOT, relativePath)), `expected ${relativePath} to exist`).toBe(true);
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("root layout metadata (UI-21)", () => {
  const layout = src("src/app/layout.tsx");

  test("exports a viewport with light and dark themeColor", () => {
    expect(layout).toContain("export const viewport: Viewport");
    expect(layout).toContain("themeColor");
    // Hex equivalents of the --background tokens in globals.css.
    expect(layout).toContain("#ffffff");
    expect(layout).toContain("#121212");
    expect(layout).toContain("(prefers-color-scheme: light)");
    expect(layout).toContain("(prefers-color-scheme: dark)");
  });

  test("exports honest openGraph metadata (no fabricated URLs)", () => {
    expect(layout).toContain("openGraph: {");
    expect(layout).toContain('siteName: "Nuvia"');
    expect(layout).toContain('type: "website"');
    expect(layout).toContain('locale: "en_US"');

    const openGraphBlock = layout.slice(layout.indexOf("openGraph: {"), layout.indexOf("};"));
    expect(openGraphBlock).not.toMatch(/https?:\/\//);
    expect(openGraphBlock).not.toContain("url:");
  });
});

describe("opengraph image route (UI-21)", () => {
  test("src/app/opengraph-image.tsx exists with 1200x630 export and alt", () => {
    const og = src("src/app/opengraph-image.tsx");
    expect(og).toContain('from "next/og"');
    expect(og).toContain("ImageResponse");
    expect(og).toContain("export const alt");
    expect(og).toContain("width: 1200");
    expect(og).toContain("height: 630");
    // Honest brand card: name plus tagline, solid token background.
    expect(og).toContain("Nuvia");
    expect(og).toContain("#121212");
  });
});

describe("next.config remotePatterns (UI-21)", () => {
  const config = src("next.config.ts");

  test("allow the configured OAuth avatar host", () => {
    // src/lib/auth/core.ts configures Google as the only social provider
    // today; GitHub/LinkedIn are still TODO there, so their hosts must NOT
    // be listed yet.
    const authCore = src("src/lib/auth/core.ts");
    expect(authCore).toContain("google: {");
    expect(authCore).not.toMatch(/^\s*github:\s*\{/m);

    expect(config).toContain('hostname: "lh3.googleusercontent.com"');
    expect(config).not.toContain("avatars.githubusercontent.com");
  });
});

describe("owned components render no raw <img> (UI-21)", () => {
  const owned = [
    "src/components/ui/sidebar/sidebar-dashboard.tsx",
    "src/app/dashboard/learning/courses/[courseId]/_components/course-sidebar-card.tsx",
    "src/components/events/event-card.tsx",
    "src/components/auth/auth-layout.tsx",
    "src/app/auth/callback/page.tsx",
    "src/app/auth/forgot-password/page.tsx",
  ];

  test.each(owned)("%s has no raw <img> tag", (file) => {
    expect(src(file)).not.toContain("<img");
  });

  test("sidebar avatar uses the Avatar primitive", () => {
    const sidebar = src("src/components/ui/sidebar/sidebar-dashboard.tsx");
    expect(sidebar).toContain('from "@/components/ui/avatar"');
    expect(sidebar).toContain("<AvatarImage");
    expect(sidebar).toContain("<AvatarFallback");
  });

  test("course sidebar card uses next/image with a remotePatterns guard", () => {
    const card = src(
      "src/app/dashboard/learning/courses/[courseId]/_components/course-sidebar-card.tsx",
    );
    expect(card).toContain('from "next/image"');
    expect(card).toContain("fill");
    expect(card).toContain("sizes=");
    // Admin-entered thumbnails whose host is outside remotePatterns get the
    // icon placeholder instead of an unsafe next/image src.
    expect(card).toContain("lh3.googleusercontent.com");
  });
});

describe("auth logo overflow fix (UI-21)", () => {
  const logoFiles = [
    "src/components/auth/auth-layout.tsx",
    "src/app/auth/callback/page.tsx",
    "src/app/auth/forgot-password/page.tsx",
  ];

  test.each(logoFiles)("%s clips the 60px logo inside its 48px box", (file) => {
    const content = src(file);
    const box = content.match(/inline-flex items-center justify-center w-12 h-12[^"]*/);
    expect(box, `${file} should keep the w-12 h-12 logo box`).not.toBeNull();
    expect(box![0]).toContain("overflow-hidden");
    expect(content).toContain("object-contain");
  });
});

describe("event card dead branch (UI-21)", () => {
  test("event-card no longer references coverImage", () => {
    // The events schema (src/db/schema/events.ts) has no coverImage column,
    // so the card's old coverImage branch was dead code; the calendar
    // placeholder stays.
    const card = src("src/components/events/event-card.tsx");
    expect(card).not.toContain("coverImage");
    expect(card).toContain("<Calendar");
    const schema = src("src/db/schema/events.ts");
    expect(schema).not.toContain("coverImage");
  });
});
