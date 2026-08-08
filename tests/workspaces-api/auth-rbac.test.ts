/**
 * D5 — Workspaces API: authentication and per-action RBAC.
 * Part of the split workspaces suite in tests/workspaces-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GET as listWorkspaces, POST as createWorkspace } from "@/app/api/v1/workspaces/route";
import { GET as getWorkspace } from "@/app/api/v1/workspaces/[id]/route";
import { API, buildRequest, createFixtures, ctx } from "./fixtures";

const { signUpWithRole, workspacePayload, cleanup } = createFixtures();

let member = { userId: "", email: "", cookie: "" };
let reader = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [member, reader, staff] = await Promise.all([
    signUpWithRole("member", "member"),
    signUpWithRole("reader", "member_corporate"),
    signUpWithRole("staff", "staff"),
  ]);
});

afterAll(cleanup);

describe("workspaces authentication and RBAC", () => {
  test("listing requires authentication and workspaces:read", async () => {
    expect((await listWorkspaces(buildRequest(API))).status).toBe(401);
    // Bare `member` holds no workspaces permissions — even reads are 403.
    expect((await listWorkspaces(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);
    // member_corporate holds workspaces:read only.
    expect((await listWorkspaces(buildRequest(API, { cookie: reader.cookie }))).status).toBe(200);
    // staff holds workspaces:read/update/manage.
    expect((await listWorkspaces(buildRequest(API, { cookie: staff.cookie }))).status).toBe(200);
  });

  test("creating requires workspaces:create", async () => {
    expect(
      (await createWorkspace(buildRequest(API, { method: "POST", body: workspacePayload("anon") })))
        .status,
    ).toBe(401);
    expect(
      (
        await createWorkspace(
          buildRequest(API, { method: "POST", cookie: member.cookie, body: workspacePayload("m") }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await createWorkspace(
          buildRequest(API, {
            method: "POST",
            cookie: reader.cookie,
            body: workspacePayload("r"),
          }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not create
    expect(
      (
        await createWorkspace(
          buildRequest(API, { method: "POST", cookie: staff.cookie, body: workspacePayload("s") }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require workspaces:read", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (await getWorkspace(buildRequest(`${API}/${missing}`), ctx({ id: missing }))).status,
    ).toBe(401);
    expect(
      (
        await getWorkspace(
          buildRequest(`${API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });
});
