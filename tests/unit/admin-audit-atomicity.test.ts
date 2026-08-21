import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const readSource = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

describe("privileged creation audit atomicity", () => {
  test("custom role creation writes the role and audit in one transaction", () => {
    const source = readSource("src/app/api/v1/admin/roles/route.ts");

    expect(source).toContain("db.transaction");
    expect(source).toMatch(/tx\s*\.\s*insert\(customRole\)/);
    expect(source).toMatch(/tx\s*\.\s*insert\(authLog\)/);
    expect(source).not.toContain("db.insert(authLog)");
  });

  test("admin user creation writes the user and audit in one transaction", () => {
    const source = readSource("src/app/api/v1/admin/users/route.ts");

    expect(source).toContain("db.transaction");
    expect(source).toMatch(/tx\s*\.\s*insert\(user\)/);
    expect(source).toMatch(/tx\s*\.\s*insert\(authLog\)/);
    expect(source).not.toContain("db.insert(authLog)");
  });
});
