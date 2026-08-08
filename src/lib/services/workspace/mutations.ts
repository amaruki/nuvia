/**
 * Workspace writes — create, update, and delete. Every failure throws
 * WorkspaceServiceError carrying an RFC 9457 problem.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { committee, workspace } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import type { CommitteeWorkspace } from "@/types/committee";
import {
  UI_TO_DB_STATUS,
  UI_TO_DB_TYPE,
  UNIQUE_VIOLATION,
  WorkspaceServiceError,
  pgErrorCode,
  toUiWorkspace,
} from "./helpers";
import { getWorkspace } from "./queries";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "./helpers";
import type { WorkspaceRow } from "./types";

async function assertCommitteeExists(committeeId: string): Promise<void> {
  const rows = await db
    .select({ id: committee.id })
    .from(committee)
    .where(eq(committee.id, committeeId))
    .limit(1);
  if (rows.length === 0) {
    throw new WorkspaceServiceError(
      problem("validation-error", 422, "Validation failed", "Unknown committee", {
        errors: [{ field: "committeeId", message: "Committee does not exist" }],
      }),
    );
  }
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  actorId: string,
): Promise<CommitteeWorkspace> {
  if (input.committeeId) {
    await assertCommitteeExists(input.committeeId);
  }

  let row: WorkspaceRow;
  try {
    [row] = await db
      .insert(workspace)
      .values({
        name: input.name,
        description: input.description,
        type: UI_TO_DB_TYPE[input.type],
        status: UI_TO_DB_STATUS[input.status],
        committeeId: input.committeeId,
        settings: input.settings,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new WorkspaceServiceError(
        problems.conflict(`A workspace named "${input.name}" already exists`),
      );
    }
    throw error;
  }
  return toUiWorkspace(row);
}

export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput,
  actorId: string,
): Promise<CommitteeWorkspace> {
  const existing = await db.select().from(workspace).where(eq(workspace.id, id)).limit(1);
  if (existing.length === 0) {
    throw new WorkspaceServiceError(problems.notFound("Workspace not found"));
  }

  if (input.committeeId) {
    await assertCommitteeExists(input.committeeId);
  }

  const patch: Partial<typeof workspace.$inferInsert> = { updatedBy: actorId };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.type !== undefined) patch.type = UI_TO_DB_TYPE[input.type];
  if (input.status !== undefined) patch.status = UI_TO_DB_STATUS[input.status];
  if (input.committeeId !== undefined) patch.committeeId = input.committeeId;
  if (input.settings !== undefined) patch.settings = input.settings;

  try {
    await db.update(workspace).set(patch).where(eq(workspace.id, id));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new WorkspaceServiceError(
        problems.conflict(`A workspace named "${input.name ?? existing[0].name}" already exists`),
      );
    }
    throw error;
  }

  const updated = await getWorkspace(id);
  if (!updated) {
    throw new WorkspaceServiceError(problems.notFound("Workspace not found"));
  }
  return updated;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const deleted = await db
    .delete(workspace)
    .where(eq(workspace.id, id))
    .returning({ id: workspace.id });
  return deleted.length > 0;
}
