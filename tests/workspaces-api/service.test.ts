/**
 * D5 — Workspaces API: service layer (direct).
 * Part of the split workspaces suite in tests/workspaces-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createWorkspace as createWorkspaceDirect,
  deleteWorkspace as deleteWorkspaceDirect,
  getWorkspace as getWorkspaceDirect,
  updateWorkspace as updateWorkspaceDirect,
} from "@/lib/services/workspace.service";
import { createFixtures, settingsPayload } from "./fixtures";

const { RUN_ID, workspaceIds, signUpWithRole, cleanup } = createFixtures();

let admin = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole("admin", "admin");
});

afterAll(cleanup);

describe("workspace service layer", () => {
  test("create/get/update/delete round-trip", async () => {
    const created = await createWorkspaceDirect(
      {
        name: `d5-workspace-svc-${RUN_ID}`,
        description: "Service-layer workspace",
        type: "discussion",
        status: "archived",
        committeeId: undefined,
        settings: settingsPayload(),
      },
      admin.userId,
    );
    workspaceIds.push(created.id);

    expect(created.type).toBe("discussion");
    expect(created.status).toBe("archived");
    expect(created.committeeId).toBe("");
    expect(created.members).toEqual([]);
    // createdBy holds the acting user's id (FK users.id).
    expect(created.createdBy).toBe(admin.userId);
    expect(created.createdAt).toBeInstanceOf(Date);

    const fetched = await getWorkspaceDirect(created.id);
    expect(fetched?.name).toBe(created.name);

    const updated = await updateWorkspaceDirect(created.id, { status: "active" }, admin.userId);
    expect(updated.status).toBe("active");
    expect(updated.updatedBy).toBe(admin.userId);

    expect(await deleteWorkspaceDirect(created.id)).toBe(true);
    expect(await deleteWorkspaceDirect(created.id)).toBe(false);
    expect(await getWorkspaceDirect(created.id)).toBeNull();
  });

  test("unknown ids surface as null/false, not throws", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await getWorkspaceDirect(missing)).toBeNull();
    expect(await deleteWorkspaceDirect(missing)).toBe(false);
  });
});
