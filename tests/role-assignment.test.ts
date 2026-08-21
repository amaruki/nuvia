import { afterEach, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, customRole, user } from "@/db/schema";
import {
  canAssignRole,
  canGrantPermissions,
  changeUserRole,
  isLastSuperadmin,
  runUnlessLastSuperadmin,
} from "@/lib/rbac";
import type { Permission } from "@/types/role";

const createdUserIds: string[] = [];
const createdRoleNames: string[] = [];

async function createTestUser(role: string): Promise<string> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const [row] = await db
    .insert(user)
    .values({
      username: `role-assign-test-${suffix}`,
      email: `role-assign-test-${suffix}@example.test`,
      name: "Role Assignment Test",
      role,
      emailVerified: false,
    })
    .returning({ id: user.id });

  createdUserIds.push(row.id);
  return row.id;
}

async function createTestRole(name: string, permissions: Permission[], isActive = true) {
  await db.insert(customRole).values({ name, permissions, isSystem: false, isActive });
  createdRoleNames.push(name);
}

// Each test cleans up after itself (afterEach, not afterAll): several
// tests below assert global superadmin counts, so a superadmin row left
// behind by an earlier test would corrupt a later one.
afterEach(async () => {
  if (createdUserIds.length > 0) {
    // auth_logs.user_id carries no ON DELETE CASCADE, so audit rows
    // written by successful role changes must go first.
    await db.delete(authLog).where(inArray(authLog.userId, createdUserIds));
    await db.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  }

  if (createdRoleNames.length > 0) {
    await db.delete(customRole).where(inArray(customRole.name, createdRoleNames));
    createdRoleNames.length = 0;
  }
});

// canAssignRole is the pure rule every role grant funnels through
// (rbac.ts's checkRoleAssignable -> changeUserRole, and the admin
// user-create route). The route handlers themselves need a live Next
// request lifecycle, so the rule is proven here directly.
describe("canAssignRole", () => {
  test("only superadmin can grant superadmin", () => {
    expect(canAssignRole("admin", [], "superadmin", [])).toBe(false);
    expect(canAssignRole("staff", [], "superadmin", [])).toBe(false);
    expect(canAssignRole("superadmin", [], "superadmin", [])).toBe(true);
  });

  test("superadmin can grant any other role", () => {
    expect(canAssignRole("superadmin", [], "admin", [])).toBe(true);
    expect(canAssignRole("superadmin", [], "member", [])).toBe(true);
  });

  test("predefined roles require the assigner to strictly outrank them", () => {
    expect(canAssignRole("admin", [], "staff", [])).toBe(true);
    expect(canAssignRole("admin", [], "admin", [])).toBe(false); // same level
    expect(canAssignRole("staff", [], "admin", [])).toBe(false); // upward
    expect(canAssignRole("staff", [], "member", [])).toBe(true);
  });

  test("custom assigner roles sit at hierarchy level 0 and cannot grant predefined roles", () => {
    expect(canAssignRole("some_custom_role", [], "member", [])).toBe(false);
  });

  test("custom target roles are grantable only when the assigner holds every permission they carry", () => {
    const assignerPermissions: Permission[] = ["events:read", "events:publish"];

    expect(canAssignRole("admin", assignerPermissions, "custom-a", ["events:read"])).toBe(true);
    expect(canAssignRole("admin", assignerPermissions, "custom-a", ["system:manage"])).toBe(false);
    expect(
      canAssignRole("admin", assignerPermissions, "custom-a", ["events:read", "users:delete"]),
    ).toBe(false);
  });
});

describe("canGrantPermissions (custom role creation rule)", () => {
  test("creators may only bake in permissions they hold", () => {
    expect(canGrantPermissions("admin", ["events:read"], ["events:read"])).toBe(true);
    expect(canGrantPermissions("admin", ["events:read"], ["system:manage"])).toBe(false);
  });

  test("superadmin is exempt", () => {
    expect(canGrantPermissions("superadmin", [], ["system:manage", "users:delete"])).toBe(true);
  });
});

describe("changeUserRole enforcement", () => {
  test("an admin cannot promote a member to superadmin", async () => {
    const adminId = await createTestUser("admin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, "superadmin", adminId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("ROLE_NOT_ASSIGNABLE");

    const row = await db.query.user.findFirst({ where: eq(user.id, memberId) });
    expect(row?.role).toBe("member");
  });

  test("an admin cannot promote a member to admin (same level)", async () => {
    const adminId = await createTestUser("admin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, "admin", adminId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("ROLE_NOT_ASSIGNABLE");
  });

  test("an admin can promote a member to staff (strictly lower)", async () => {
    const adminId = await createTestUser("admin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, "staff", adminId);

    expect(result.success).toBe(true);

    const row = await db.query.user.findFirst({ where: eq(user.id, memberId) });
    expect(row?.role).toBe("staff");
  });

  test("superadmin can promote a member to admin", async () => {
    const superadminId = await createTestUser("superadmin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, "admin", superadminId);

    expect(result.success).toBe(true);
  });

  test("nobody can demote a superadmin (canManage gate)", async () => {
    const adminId = await createTestUser("admin");
    const superadminId = await createTestUser("superadmin");

    const result = await changeUserRole(superadminId, "member", adminId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("INSUFFICIENT_PERMISSIONS");
  });

  test("an unknown role name is rejected", async () => {
    const adminId = await createTestUser("admin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, `no-such-role-${Date.now()}`, adminId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_ROLE");
  });

  test("an inactive custom role is rejected", async () => {
    const roleName = `inactive-role-${Date.now()}`;
    await createTestRole(roleName, ["events:read"], false);

    const adminId = await createTestUser("admin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, roleName, adminId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_ROLE");
  });

  test("an admin can assign a custom role whose permissions they hold", async () => {
    const roleName = `grantable-role-${Date.now()}`;
    await createTestRole(roleName, ["events:read"]);

    const adminId = await createTestUser("admin"); // admin holds events:read
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, roleName, adminId);

    expect(result.success).toBe(true);
  });

  test("an admin cannot assign a custom role carrying permissions they lack", async () => {
    const roleName = `overpowered-role-${Date.now()}`;
    await createTestRole(roleName, ["system:manage"]); // admin does not hold system:*

    const adminId = await createTestUser("admin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, roleName, adminId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("ROLE_NOT_ASSIGNABLE");
  });

  test("superadmin can assign a custom role carrying any permissions", async () => {
    const roleName = `super-role-${Date.now()}`;
    await createTestRole(roleName, ["system:manage"]);

    const superadminId = await createTestUser("superadmin");
    const memberId = await createTestUser("member");

    const result = await changeUserRole(memberId, roleName, superadminId);

    expect(result.success).toBe(true);
  });

  test("a superadmin can demote another superadmin while one other remains", async () => {
    const firstId = await createTestUser("superadmin");
    const secondId = await createTestUser("superadmin");

    const result = await changeUserRole(secondId, "admin", firstId);

    expect(result.success).toBe(true);

    const row = await db.query.user.findFirst({ where: eq(user.id, secondId) });
    expect(row?.role).toBe("admin");

    // Restore: put the second superadmin back so this pair leaves the
    // table the way it entered.
    const restore = await changeUserRole(secondId, "superadmin", firstId);
    expect(restore.success).toBe(true);
  });

  test("concurrent mutual demotions preserve one superadmin", async () => {
    const firstId = await createTestUser("superadmin");
    const secondId = await createTestUser("superadmin");

    const results = await Promise.all([
      changeUserRole(firstId, "admin", secondId),
      changeUserRole(secondId, "admin", firstId),
    ]);
    const rows = await db
      .select({ role: user.role })
      .from(user)
      .where(inArray(user.id, [firstId, secondId]));

    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(rows.filter((row) => row.role === "superadmin")).toHaveLength(1);
  });
});

describe("isLastSuperadmin (lockout guard)", () => {
  test("true for the only superadmin, false once a second exists, false for non-superadmins", async () => {
    const firstId = await createTestUser("superadmin");
    expect(await isLastSuperadmin(firstId)).toBe(true);

    const secondId = await createTestUser("superadmin");
    expect(await isLastSuperadmin(firstId)).toBe(false);
    expect(await isLastSuperadmin(secondId)).toBe(false);

    const memberId = await createTestUser("member");
    expect(await isLastSuperadmin(memberId)).toBe(false);
  });

  test("concurrent destructive operations preserve one superadmin", async () => {
    const firstId = await createTestUser("superadmin");
    const secondId = await createTestUser("superadmin");

    const results = await Promise.all([
      runUnlessLastSuperadmin(firstId, () => db.delete(user).where(eq(user.id, firstId))),
      runUnlessLastSuperadmin(secondId, () => db.delete(user).where(eq(user.id, secondId))),
    ]);
    const rows = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, [firstId, secondId]));

    expect(results.filter((result) => result.allowed)).toHaveLength(1);
    expect(rows).toHaveLength(1);
  });
});
