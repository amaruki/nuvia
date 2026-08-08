/**
 * Awards API — service layer (direct): createAwardProgram returns the DB row
 * and delete/read round-trip through the service without route handlers
 * (backlog D4). Shared fixtures and RUN_ID isolation live in ./helpers.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  createAwardProgram as createAwardProgramDirect,
  deleteAwardProgram as deleteAwardProgramDirect,
  getAwardProgram as getAwardProgramDirect,
} from "@/lib/services/award";
import { newRunId, signUpWithRole, sweepFixtures, type TestUser } from "./helpers";

const RUN_ID = newRunId();

const userIds: string[] = [];
const programIds: string[] = [];

let admin: TestUser = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole(RUN_ID, "admin", "admin", userIds);
});

afterAll(async () => {
  await sweepFixtures(RUN_ID, programIds, userIds);
});

describe("award service layer", () => {
  test("direct create/read/delete round-trip", async () => {
    const created = await createAwardProgramDirect(
      {
        name: `d4-program-direct-${RUN_ID}`,
        description: "Created directly through the service",
        category: "innovation",
        status: "draft",
        criteria: [],
      },
      admin.email,
    );
    programIds.push(created.id);
    expect(created.status).toBe("draft");
    expect(created.category).toBe("innovation");
    expect(created.nominationCount).toBe(0);

    const found = await getAwardProgramDirect(created.id);
    expect(found?.name).toBe(`d4-program-direct-${RUN_ID}`);

    expect(await deleteAwardProgramDirect(created.id)).toBe(true);
    expect(await deleteAwardProgramDirect(created.id)).toBe(false);
    expect(await getAwardProgramDirect(created.id)).toBeNull();
  });
});
