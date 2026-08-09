/**
 * UI-18: Dependency hygiene.
 *
 * D6 decided: every Radix primitive comes from the unified radix-ui package
 * (1.6.7); the 18 individual @radix-ui/react-* packages are removed in a
 * single deliberate commit. loading-skeleton exports a named component like
 * every other ui primitive.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (p: string) => Bun.file(join(root, p)).text();

const packageJson = JSON.parse(await read("package.json"));
const deps = packageJson.dependencies ?? {};

describe("radix dependencies are unified", () => {
  test("the unified radix-ui package is pinned", () => {
    expect(deps["radix-ui"]).toBe("1.6.7");
  });

  test("no individual @radix-ui/react-* package remains", () => {
    const leftovers = Object.keys(deps).filter((name) => name.startsWith("@radix-ui/react-"));
    expect(leftovers).toEqual([]);
  });
});

describe("source imports use the unified package", () => {
  test("no file under src imports an individual radix package", async () => {
    const offenders: string[] = [];
    for await (const file of new Bun.Glob("src/**/*.{ts,tsx}").scan(root)) {
      const src = await read(file);
      if (/from "@radix-ui\/react-/.test(src)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  test("ui primitives that need radix reach for the unified package", async () => {
    const dialog = await read("src/components/ui/dialog.tsx");
    const select = await read("src/components/ui/select.tsx");
    const button = await read("src/components/ui/button.tsx");
    expect(dialog).toContain('from "radix-ui"');
    expect(select).toContain('from "radix-ui"');
    expect(button).toContain('from "radix-ui"');
  });
});

describe("loading-skeleton consistency", () => {
  test("exports a named component, no default export", async () => {
    const src = await read("src/components/ui/loading-skeleton.tsx");
    expect(src).toContain("export function LoadingSkeleton");
    expect(src).not.toMatch(/export default/);
  });

  test("its consumer imports the named export", async () => {
    const src = await read("src/components/memberships/membership-list/loading-state.tsx");
    expect(src).toMatch(/import \{[^}]*LoadingSkeleton[^}]*\} from/);
  });
});
