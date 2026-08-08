/**
 * D5 — Workspaces API: deletion gating.
 * Part of the split workspaces suite in tests/workspaces-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createWorkspace } from "@/app/api/v1/workspaces/route";
import { DELETE as deleteWorkspace } from "@/app/api/v1/workspaces/[id]/route";
import { API, buildRequest, createFixtures, ctx, parseEnvelope } from "./fixtures";

const { state, workspaceIds, signUpWithRole, workspacePayload, cleanup } = createFixtures();

let admin = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };
let reader = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member, reader] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
    signUpWithRole("reader", "member_corporate"),
  ]);

  // gamma mirrors the deletion target the single-file suite deleted:
  // locked, meeting-typed.
  const res = await createWorkspace(
    buildRequest(API, {
      method: "POST",
      cookie: admin.cookie,
      body: workspacePayload("gamma", { status: "locked", type: "meeting" }),
    }),
  );
  const envelope = await parseEnvelope(res);
  workspaceIds.push(envelope.data.id);
  state.gammaId = envelope.data.id;
});

afterAll(cleanup);

describe("workspace deletion", () => {
  test("delete requires workspaces:delete", async () => {
    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: member.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not delete
    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: staff.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // member_corporate holds read only
    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: reader.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
  });

  test("admin deletes and a second delete is a 404", async () => {
    const res = await deleteWorkspace(
      buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.gammaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data).toEqual({ id: state.gammaId, deleted: true });

    expect(
      (
        await deleteWorkspace(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(404);
  });
});
