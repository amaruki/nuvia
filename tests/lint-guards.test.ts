/**
 * Phase 8 guardrails (docs/planning/03-frontend-improvement-plan.md, items 1
 * and 6).
 *
 * Item 1: oxlint bans native alert/confirm/prompt via "no-alert": "error" in
 * .oxlintrc.json. Live call-site scanning happens at lint time and in
 * no-native-dialogs.test.ts; here we only pin the config wiring.
 *
 * Item 6: scripts/check-copy-style.ts guards user-facing copy (em dashes and
 * emoji glyphs in string literals and JSX text). This test pins the scanner
 * behavior and runs the tree ratchet so `bun test` catches new copy-style
 * violations even when guard:light is skipped.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BASELINE, evaluateCounts, scanSource } from "../scripts/check-copy-style";

const ROOT = join(import.meta.dir, "..");

describe("lint guards are wired in .oxlintrc.json", () => {
  // The config is JSONC; strip full-line comments before parsing.
  const configText = readFileSync(join(ROOT, ".oxlintrc.json"), "utf8");
  const config = JSON.parse(configText.replace(/^\s*\/\/.*$/gm, ""));

  test("no-alert is an error (UI-06: no native dialogs)", () => {
    expect(config.rules["no-alert"]).toBe("error");
  });
});

describe("copy-style scanner", () => {
  test("flags em dashes and emoji in string literals, templates, and JSX text", () => {
    const source = [
      'const a = "em dash — here";',
      "const b = `rocket 🚀 in a template`;",
      "const c = <p>arrow ← in JSX text</p>;",
    ].join("\n");
    expect(scanSource(source)).toHaveLength(3);
  });

  test("ignores glyphs inside line and block comments", () => {
    const source = [
      "// em dash — inside a line comment",
      "/* emoji 🚀 inside",
      "   a block comment */",
    ].join("\n");
    expect(scanSource(source)).toHaveLength(0);
  });
});

describe("copy-style ratchet over src/", () => {
  test("no new em dash / emoji violations beyond the baseline", async () => {
    const counts = new Map<string, number>();
    for await (const file of new Bun.Glob("src/**/*.{ts,tsx}").scan(ROOT)) {
      const source = await Bun.file(join(ROOT, file)).text();
      const hits = scanSource(source).length;
      if (hits > 0) counts.set(file, hits);
    }
    const { errors, newViolations, baselined } = evaluateCounts(counts, BASELINE);
    expect(errors).toEqual([]);
    expect(newViolations).toBe(0);
    // Consistency: the tree still carries exactly the baselined debt total.
    const expected = Object.values(BASELINE).reduce((sum, n) => sum + n, 0);
    expect(baselined).toBe(expected);
  });
});
