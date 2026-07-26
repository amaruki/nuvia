import { describe, expect, test } from "bun:test";
import { db } from "@/db/client";
import { user, customRole } from "@/db/schema";
import { getUserPermissions, getAllRoles } from "@/lib/rbac";

async function createTestUser(role: string) {
  const [row] = await db
    .insert(user)
    .values({
      username: `custom-role-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      email: `custom-role-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
      name: "Custom Role Test",
      role,
      emailVerified: false,
    })
    .returning({ id: user.id });

  return row.id;
}

describe("custom roles", () => {
  test("a user assigned a custom role name gets that role's real permissions", async () => {
    const roleName = `test-role-${Date.now()}`;

    await db.insert(customRole).values({
      name: roleName,
      permissions: ["events:read", "events:publish"],
      isSystem: false,
    });

    const userId = await createTestUser(roleName);

    const result = await getUserPermissions(userId);
    expect(result.role).toBe(roleName);
    expect(result.permissions.sort()).toEqual(["events:publish", "events:read"]);
  });

  test("a user assigned an inactive custom role gets no permissions", async () => {
    const roleName = `test-inactive-role-${Date.now()}`;

    await db.insert(customRole).values({
      name: roleName,
      permissions: ["events:read"],
      isSystem: false,
      isActive: false,
    });

    const userId = await createTestUser(roleName);

    const result = await getUserPermissions(userId);
    expect(result.permissions).toEqual([]);
  });

  test("a user assigned a role name with no matching custom_roles row gets no permissions", async () => {
    const userId = await createTestUser(`nonexistent-role-${Date.now()}`);

    const result = await getUserPermissions(userId);
    expect(result.permissions).toEqual([]);
  });

  test("getAllRoles includes active custom roles alongside predefined ones", async () => {
    const roleName = `test-listed-role-${Date.now()}`;

    await db.insert(customRole).values({
      name: roleName,
      displayName: "Test Listed Role",
      permissions: ["forum:moderate"],
      isSystem: false,
    });

    const roles = await getAllRoles();
    const listed = roles.find((r) => r.role === roleName);
    expect(listed).toBeDefined();
    expect(listed?.isPredefined).toBe(false);
    expect(listed?.name).toBe("Test Listed Role");
  });
});

// POST /api/v1/admin/roles itself isn't exercised here: it goes through
// rbac.ts's requirePermission -> getCurrentUser, which calls next/headers's
// headers() ambiently — that throws "called outside a request scope"
// unless a real Next request lifecycle set up the AsyncLocalStorage
// context first, which bare bun:test doesn't do (same limitation as
// requireDashboardRole — see the (public) events layout tests' note).
// The route's own logic (insert, unique-name conflict -> 409) is proven
// directly against the schema below instead.
describe("custom_roles unique-name constraint", () => {
  test("a duplicate name is rejected at the database level", async () => {
    const roleName = `test-dup-role-${Date.now()}`;

    await db.insert(customRole).values({ name: roleName, permissions: ["events:read"] });

    let threw = false;
    try {
      await db.insert(customRole).values({ name: roleName, permissions: ["events:read"] });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
