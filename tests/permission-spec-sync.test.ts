/**
 * Phase 8 guardrail item 9: permission spec sync.
 *
 * Technical spec 09 §9.4 names the `PERMISSION_MODULES` list and
 * `src/types/role/permission-types.ts` defines it. This test parses the
 * backticked module names out of the §9.4 prose and asserts set-equality
 * with `PERMISSION_MODULES`, so neither side can drift silently again
 * (the spec shipped with 12 modules while the code defined 16).
 *
 * Run: bun test tests/permission-spec-sync.test.ts
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

import { PERMISSION_MODULES } from "@/types/role/permission-types";

const ROOT = join(import.meta.dir, "..");
const SPEC_PATH = join(ROOT, "docs", "technical-specs", "09-authentication-and-authorization.md");

/** The §9.4 body: from its own heading down to (excluding) the next `## ` heading. */
function permissionModelSection(markdown: string): string {
  const heading = markdown.search(/^## 9\.4\b/m);
  expect(heading, "spec 09 lost its '## 9.4 Permission model' heading").not.toBe(-1);
  const fromHeading = markdown.slice(heading);
  const nextHeading = fromHeading.slice(1).search(/^## /m);
  return nextHeading === -1 ? fromHeading : fromHeading.slice(0, nextHeading + 1);
}

/**
 * The backticked module names between the `PERMISSION_MODULES` marker and
 * the `PERMISSION_ACTIONS` marker; nothing else in §9.4 is backticked in
 * that span, so this isolates exactly the module list.
 */
function modulesFromSpec(section: string): string[] {
  const list = section.match(/`PERMISSION_MODULES`:\s*([\s\S]*?)\.\s*`PERMISSION_ACTIONS`:/);
  expect(
    list,
    "§9.4 must list `PERMISSION_MODULES`: ... followed by `PERMISSION_ACTIONS`: ...",
  ).not.toBeNull();
  const modules = [...(list?.[1] ?? "").matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  expect(
    modules.length,
    "§9.4 module list parsed empty; check the backticked list format",
  ).toBeGreaterThan(0);
  return modules;
}

describe("Phase 8 item 9: spec 09 §9.4 permission modules match PERMISSION_MODULES", () => {
  const spec = readFileSync(SPEC_PATH, "utf8");
  const specModules = modulesFromSpec(permissionModelSection(spec));
  const codeModules: string[] = [...PERMISSION_MODULES];

  test("every PERMISSION_MODULES entry is listed in §9.4", () => {
    const missing = codeModules.filter((module) => !specModules.includes(module));
    expect(missing, "modules defined in code but missing from spec §9.4").toEqual([]);
  });

  test("§9.4 lists no module the code does not define", () => {
    const extra = specModules.filter((module) => !codeModules.includes(module));
    expect(extra, "modules named in spec §9.4 but absent from PERMISSION_MODULES").toEqual([]);
  });

  test("§9.4 lists each module exactly once", () => {
    const duplicates = specModules.filter((module, index) => specModules.indexOf(module) !== index);
    expect(duplicates, "duplicated module names in spec §9.4").toEqual([]);
  });
});
