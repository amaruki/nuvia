/**
 * D5 — Workspaces API: workspace creation.
 * Part of the split workspaces suite in tests/workspaces-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createWorkspace } from "@/app/api/v1/workspaces/route";
import { API, buildRequest, createFixtures, parseEnvelope, settingsPayload } from "./fixtures";

const { RUN_ID, state, workspaceIds, signUpWithRole, workspacePayload, seedCommittee, cleanup } =
  createFixtures();

let admin = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole("admin", "admin");
  await seedCommittee(admin.userId);
});

afterAll(cleanup);

describe("workspace creation", () => {
  test("create validates the payload", async () => {
    const empty = await createWorkspace(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("bad", { status: "dormant" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const shortName = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("short", { name: "ab" }),
      }),
    );
    expect(shortName.status).toBe(422);

    const missingSettings = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("settings", { settings: undefined }),
      }),
    );
    expect(missingSettings.status).toBe(422);

    const zeroArchive = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("archive", {
          settings: { ...settingsPayload(), autoArchiveDays: 0 },
        }),
      }),
    );
    expect(zeroArchive.status).toBe(422);

    const noPermissions = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("perms", {
          settings: { ...settingsPayload(), memberPermissions: [] },
        }),
      }),
    );
    expect(noPermissions.status).toBe(422);
  });

  test("admin creates a workspace and the envelope carries the full UI shape", async () => {
    const res = await createWorkspace(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: workspacePayload("alpha") }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope(res);
    const created = envelope.data;
    workspaceIds.push(created.id);
    state.alphaId = created.id;

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.name).toBe(`d5-workspace-alpha-${RUN_ID}`);
    expect(created.description).toBe("D5 test workspace alpha");
    expect(created.type).toBe("general");
    expect(created.status).toBe("active");
    expect(created.committeeId).toBe("");
    expect(created.settings.autoArchiveDays).toBe(365);
    expect(created.settings.memberPermissions.length).toBe(2);
    // Collaboration collections start empty — roster/content management is
    // DB-only until a later backlog item.
    expect(created.members).toEqual([]);
    expect(created.documents).toEqual([]);
    expect(created.tasks).toEqual([]);
    expect(created.discussions).toEqual([]);
    expect(created.meetings).toEqual([]);
    expect(created.activity).toEqual([]);
    // Workspaces store the acting user's id (FK users.id), not an email.
    expect(created.createdBy).toBe(admin.userId);
    expect(created.updatedBy).toBe(admin.userId);
    expect(typeof created.createdAt).toBe("string");
    expect(typeof created.updatedAt).toBe("string");
  });

  test("duplicate name is rejected with a conflict", async () => {
    const res = await createWorkspace(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: workspacePayload("alpha") }),
    );
    expect(res.status).toBe(409);
    const body = await parseEnvelope(res);
    // RFC 9457 problem document, not the success envelope
    expect(body.data).toBeUndefined();
  });

  test("unknown committee is a validation error; a real committee links", async () => {
    const unknown = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("orphan", { committeeId: "00000000-0000-4000-8000-000000000000" }),
      }),
    );
    expect(unknown.status).toBe(422);

    const linked = await createWorkspace(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: workspacePayload("delta", { type: "project", committeeId: state.committeeId }),
      }),
    );
    expect(linked.status).toBe(201);
    const envelope = await parseEnvelope(linked);
    workspaceIds.push(envelope.data.id);
    state.deltaId = envelope.data.id;
    expect(envelope.data.committeeId).toBe(state.committeeId);
  });
});
