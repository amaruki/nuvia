/**
 * D5 — Workspaces API: item read and update semantics.
 * Part of the split workspaces suite in tests/workspaces-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createWorkspace } from "@/app/api/v1/workspaces/route";
import { GET as getWorkspace, PATCH as updateWorkspace } from "@/app/api/v1/workspaces/[id]/route";
import { API, buildRequest, createFixtures, ctx, parseEnvelope, settingsPayload } from "./fixtures";

const { RUN_ID, state, workspaceIds, signUpWithRole, workspacePayload, seedCommittee, cleanup } =
  createFixtures();

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
  await seedCommittee(admin.userId);

  // alpha is the read/update target, beta the rename-conflict target, and
  // delta carries the committee link the PATCH-null test clears.
  for (const [suffix, overrides] of [
    ["alpha", {}],
    ["beta", { status: "archived", type: "document" }],
    ["delta", { type: "project", committeeId: state.committeeId }],
  ] as [string, Record<string, unknown>][]) {
    const res = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload(suffix, overrides),
      }),
    );
    const envelope = await parseEnvelope(res);
    workspaceIds.push(envelope.data.id);
    state[`${suffix}Id`] = envelope.data.id;
  }
});

afterAll(cleanup);

describe("workspace read and update", () => {
  test("fetch one workspace by id", async () => {
    const res = await getWorkspace(
      buildRequest(`${API}/${state.alphaId}`, { cookie: staff.cookie }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.id).toBe(state.alphaId);
    expect(envelope.data.members).toEqual([]);
  });

  test("unknown id is a 404", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await getWorkspace(
          buildRequest(`${API}/${missing}`, { cookie: admin.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("update requires workspaces:update and a non-empty body", async () => {
    expect(
      (
        await updateWorkspace(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: member.cookie,
            body: { description: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);
    // member_corporate holds read only — no update
    expect(
      (
        await updateWorkspace(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: reader.cookie,
            body: { description: "nope" },
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(403);

    expect(
      (
        await updateWorkspace(
          buildRequest(`${API}/${state.alphaId}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: {},
          }),
          ctx({ id: state.alphaId }),
        )
      ).status,
    ).toBe(422);

    const missing = "00000000-0000-4000-8000-000000000000";
    expect(
      (
        await updateWorkspace(
          buildRequest(`${API}/${missing}`, {
            method: "PATCH",
            cookie: admin.cookie,
            body: { description: "ghost" },
          }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(404);
  });

  test("staff updates fields and the response reflects them", async () => {
    const res = await updateWorkspace(
      buildRequest(`${API}/${state.alphaId}`, {
        method: "PATCH",
        cookie: staff.cookie,
        body: {
          name: `d5-workspace-alpha-renamed-${RUN_ID}`,
          status: "locked",
          type: "project",
          settings: { ...settingsPayload(), maxFileSize: 100, requireApproval: false },
        },
      }),
      ctx({ id: state.alphaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.name).toBe(`d5-workspace-alpha-renamed-${RUN_ID}`);
    expect(envelope.data.status).toBe("locked");
    expect(envelope.data.type).toBe("project");
    expect(envelope.data.settings.maxFileSize).toBe(100);
    expect(envelope.data.settings.requireApproval).toBe(false);
    expect(envelope.data.updatedBy).toBe(staff.userId);
  });

  test("renaming onto an existing name conflicts", async () => {
    const res = await updateWorkspace(
      buildRequest(`${API}/${state.betaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { name: `d5-workspace-alpha-renamed-${RUN_ID}` },
      }),
      ctx({ id: state.betaId }),
    );
    expect(res.status).toBe(409);
  });

  test("null clears the committee link", async () => {
    const res = await updateWorkspace(
      buildRequest(`${API}/${state.deltaId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { committeeId: null },
      }),
      ctx({ id: state.deltaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.committeeId).toBe("");
  });
});
