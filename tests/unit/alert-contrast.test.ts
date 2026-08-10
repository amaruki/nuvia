/**
 * A11y regression: the destructive Alert variant painted its text with
 * --destructive, whose dark-theme value (oklch L 0.62) is tuned as a button
 * background and only reaches 3.67:1 against the dark card surface, below
 * the WCAG 2.2 AA 4.5:1 floor for normal text. The semantic messaging family
 * (--success, --warning, --info) therefore gains the missing --danger member:
 * a text-safe red in both themes, consumed by the Alert destructive variant.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const read = (p: string) => Bun.file(join(root, p)).text();

const globals = await read("src/app/globals.css");
const alert = await read("src/components/ui/alert.tsx");
const darkStart = globals.indexOf(':root[data-theme="dark"]');

describe("danger messaging token completes the semantic family", () => {
  test("globals defines --danger in the light theme", () => {
    const light = globals.slice(0, darkStart);
    expect(light).toContain("--danger:");
  });

  test("globals defines a lighter --danger in the dark theme", () => {
    const dark = globals.slice(darkStart);
    expect(dark).toContain("--danger:");
    // Text-safe lightness: the dark value must be lighter than the
    // button-tuned --destructive (L 0.62) to clear 4.5:1 on dark surfaces.
    const dangerL = dark.match(/--danger:\s*oklch\(([\d.]+)/)?.[1];
    expect(dangerL).toBeDefined();
    expect(Number(dangerL)).toBeGreaterThan(0.65);
  });

  test("globals maps --color-danger for Tailwind utilities", () => {
    expect(globals).toContain("--color-danger: var(--danger)");
  });
});

describe("destructive alert variant uses the text-safe danger token", () => {
  test("variant text and description use text-danger", () => {
    expect(alert).toContain("text-danger");
    expect(alert).toContain("*:data-[slot=alert-description]:text-danger/90");
  });

  test("variant no longer paints text with the button-tuned destructive", () => {
    expect(alert).not.toContain("text-destructive");
  });
});
