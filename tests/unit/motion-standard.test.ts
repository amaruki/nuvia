/**
 * UI-17: Motion standard, repo-wide.
 *
 * The landing contract is the standard: CSS-only, transform/opacity, fully
 * disabled under prefers-reduced-motion (PRM). This suite pins:
 *   - motion tokens (--ease-*, --duration-*) exist in :root;
 *   - document smooth scrolling and .animate-fadeInUp are PRM-gated;
 *   - dead motion classes and keyframes are gone from globals.css;
 *   - .card-hover transitions explicit properties, not `all`;
 *   - the shared button press scale is motion-safe;
 *   - auth entrances use the CSS landing-rise pattern, no anime.js;
 *   - plans/README.md reflects the implemented state (001-005 DONE).
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const read = (p: string) => Bun.file(join(root, p)).text();

const globals = await read("src/app/globals.css");
const button = await read("src/components/ui/button.tsx");
const plansReadme = await read("plans/README.md");

describe("motion tokens", () => {
  test("easing and duration tokens live in :root", () => {
    expect(globals).toMatch(/--ease-out:\s*cubic-bezier\(/);
    expect(globals).toMatch(/--ease-drawer:\s*cubic-bezier\(/);
    expect(globals).toMatch(/--duration-fast:\s*150ms/);
    expect(globals).toMatch(/--duration-normal:\s*250ms/);
    expect(globals).toMatch(/--duration-drawer:\s*300ms/);
  });

  test("the landing contract consumes the easing token", () => {
    expect(globals).toContain("animation: landing-rise 0.7s var(--ease-out) both");
  });
});

describe("reduced-motion gates", () => {
  test("smooth scrolling is gated under no-preference", () => {
    expect(globals).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{\s*html \{\s*scroll-behavior: smooth;/,
    );
  });

  test("animate-fadeInUp only runs without a reduced-motion preference", () => {
    expect(globals).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{\s*\.animate-fadeInUp \{/,
    );
  });

  test("button press scale is motion-safe", () => {
    expect(button).toContain("motion-safe:active:scale-[0.97]");
    expect(button).not.toMatch(/(?<!motion-safe:)active:scale-\[0\.97\]/);
  });
});

describe("dead motion code removed", () => {
  const dead = [
    /\.animate-shimmer\s*\{/,
    /\.animate-slideInRight\s*\{/,
    /\.animate-slideInLeft\s*\{/,
    /\.button-scale\s*\{/,
    /\.modal-content\s*\{/,
    /\.modal-overlay\s*\{/,
    /\.modal-enter\s*\{/,
    /\.modal-exit\s*\{/,
    /\.stagger-item\s*\{/,
    /\.badge-glow\s*\{/,
    /^\.skeleton\s*\{/m,
    /@keyframes shimmer\s*\{/,
    /@keyframes slideInRight\s*\{/,
    /@keyframes slideInLeft\s*\{/,
    /@keyframes fadeIn\s*\{/,
  ];

  for (const pattern of dead) {
    test(`globals.css no longer defines ${pattern.source}`, () => {
      expect(globals).not.toMatch(pattern);
    });
  }

  test("card-hover transitions explicit properties, not all", () => {
    const match = globals.match(/\.card-hover \{([^}]*)\}/);
    expect(match).not.toBeNull();
    expect(match?.[1]).not.toContain("transition: all");
    expect(match?.[1]).toContain("transform");
    expect(match?.[1]).toContain("box-shadow");
  });
});

describe("auth entrances use the landing pattern", () => {
  const authFiles = [
    "src/app/auth/login/page.tsx",
    "src/app/auth/signup/page.tsx",
    "src/app/auth/forgot-password/page.tsx",
    "src/app/auth/reset-password/page.tsx",
    "src/app/auth/callback/page.tsx",
  ];

  for (const file of authFiles) {
    test(`${file} is anime.js free and rises via CSS`, async () => {
      const src = await read(file);
      expect(src).not.toContain('from "animejs"');
      expect(src).not.toMatch(/animate\("\./);
      expect(src).toContain("landing-rise");
    });
  }

  test("auth layout carries no dead motion machinery", async () => {
    const src = await read("src/app/auth/layout.tsx");
    expect(src).not.toContain('from "animejs"');
    expect(src).not.toContain(".shape");
    expect(src).not.toContain("#f8fafc");
    expect(src).toContain("AuthLayout");
  });
});

describe("animation plan index reflects reality", () => {
  // 006 (arrow-nudge cohesion) was executed after the landing split: the
  // pattern lives in features-section.tsx ("Browse events", "Job board")
  // and cta-section.tsx (final "Get started"), with no data-icon remnants.
  test.each(["001", "002", "003", "004", "005", "006"])("plan %s is marked DONE", (plan) => {
    const row = plansReadme.split("\n").find((line) => line.startsWith(`| ${plan} |`));
    expect(row).toBeDefined();
    expect(row).toContain("DONE");
  });
});
