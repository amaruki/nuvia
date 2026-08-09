/**
 * Tests for ADR-0014: member status is derived from the membership
 * subscription lifecycle, never stored independently.
 *
 * The role-sync rules applied to a derived member status, exercised as
 * a pure function.
 */

import { describe, expect, test } from "bun:test";
import { deriveRoleFromMemberStatus } from "@/lib/services/membership-status.service";

describe("deriveRoleFromMemberStatus — the role-sync rules", () => {
  test("an entitled bare user upgrades to the default member role", () => {
    expect(deriveRoleFromMemberStatus("user", "active")).toBe("member");
    expect(deriveRoleFromMemberStatus("user", "trialing")).toBe("member");
    expect(deriveRoleFromMemberStatus("user", "in_grace")).toBe("member");
  });

  test("an entitled user keeps their specific member-tier role", () => {
    expect(deriveRoleFromMemberStatus("member_student", "active")).toBe("member_student");
    expect(deriveRoleFromMemberStatus("member_corporate", "trialing")).toBe("member_corporate");
  });

  test("a non-entitled member-tier role downgrades to user", () => {
    expect(deriveRoleFromMemberStatus("member", "expired")).toBe("user");
    expect(deriveRoleFromMemberStatus("member_professional", "paused")).toBe("user");
    expect(deriveRoleFromMemberStatus("member", "none")).toBe("user");
  });

  test("privileged and custom roles are never touched by subscription state", () => {
    expect(deriveRoleFromMemberStatus("admin", "active")).toBe("admin");
    expect(deriveRoleFromMemberStatus("moderator", "expired")).toBe("moderator");
    expect(deriveRoleFromMemberStatus("some_custom_role", "none")).toBe("some_custom_role");
  });
});
