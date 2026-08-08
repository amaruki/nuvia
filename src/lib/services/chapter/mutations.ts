/**
 * Chapter writes — create/update/delete with parent validation and
 * unique-name conflict mapping (23505 -> 409).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chapter } from "@/db/schema";
import { problem, problems } from "@/lib/http";
import type { Chapter } from "@/types/chapter.types";
import { ChapterServiceError, pgErrorCode, UNIQUE_VIOLATION } from "./errors";
import { toUiChapter, UI_TO_DB_STATUS } from "./mappers";
import { getChapter } from "./queries";
import type { CreateChapterInput, UpdateChapterInput } from "./schemas";
import type { ChapterRow } from "./types";

async function assertParentExists(parentChapterId: string, selfId?: string): Promise<void> {
  if (selfId !== undefined && parentChapterId === selfId) {
    throw new ChapterServiceError(
      problem("validation-error", 422, "Validation failed", "A chapter cannot be its own parent", {
        errors: [{ field: "parentChapterId", message: "A chapter cannot be its own parent" }],
      }),
    );
  }
  const parentRows = await db
    .select({ id: chapter.id })
    .from(chapter)
    .where(eq(chapter.id, parentChapterId))
    .limit(1);
  if (parentRows.length === 0) {
    throw new ChapterServiceError(
      problem("validation-error", 422, "Validation failed", "Unknown parent chapter", {
        errors: [{ field: "parentChapterId", message: "Parent chapter does not exist" }],
      }),
    );
  }
}

function toInsertValues(input: CreateChapterInput, actor: string) {
  return {
    name: input.name,
    displayName: input.displayName,
    description: input.description,
    status: UI_TO_DB_STATUS[input.status],
    address: input.location.address,
    city: input.location.city,
    state: input.location.state,
    country: input.location.country,
    postalCode: input.location.postalCode,
    latitude: input.location.coordinates?.latitude,
    longitude: input.location.coordinates?.longitude,
    timezone: input.location.timezone,
    region: input.location.region,
    memberCount: input.memberCount ?? 0,
    establishedDate: input.establishedDate,
    parentChapterId: input.parentChapterId,
    contactInfo: input.contactInfo,
    socialMedia: input.socialMedia,
    settings: input.settings,
    createdBy: actor,
  };
}

export async function createChapter(input: CreateChapterInput, actor: string): Promise<Chapter> {
  if (input.parentChapterId) {
    await assertParentExists(input.parentChapterId);
  }

  let row: ChapterRow;
  try {
    [row] = await db.insert(chapter).values(toInsertValues(input, actor)).returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new ChapterServiceError(
        problems.conflict(`A chapter named "${input.name}" already exists`),
      );
    }
    throw error;
  }
  return toUiChapter(row, [], []);
}

export async function updateChapter(
  id: string,
  input: UpdateChapterInput,
  actor: string,
): Promise<Chapter> {
  const existing = await db.select().from(chapter).where(eq(chapter.id, id)).limit(1);
  if (existing.length === 0) {
    throw new ChapterServiceError(problems.notFound("Chapter not found"));
  }

  if (input.parentChapterId) {
    await assertParentExists(input.parentChapterId, id);
  }

  const patch: Partial<typeof chapter.$inferInsert> = { updatedBy: actor };
  if (input.name !== undefined) patch.name = input.name;
  if (input.displayName !== undefined) patch.displayName = input.displayName;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = UI_TO_DB_STATUS[input.status];
  if (input.location !== undefined) {
    patch.address = input.location.address;
    patch.city = input.location.city;
    patch.state = input.location.state;
    patch.country = input.location.country;
    patch.postalCode = input.location.postalCode;
    patch.latitude = input.location.coordinates?.latitude;
    patch.longitude = input.location.coordinates?.longitude;
    patch.timezone = input.location.timezone;
    patch.region = input.location.region;
  }
  if (input.memberCount !== undefined) patch.memberCount = input.memberCount;
  if (input.establishedDate !== undefined) patch.establishedDate = input.establishedDate;
  if (input.parentChapterId !== undefined) patch.parentChapterId = input.parentChapterId;
  if (input.contactInfo !== undefined) patch.contactInfo = input.contactInfo;
  if (input.socialMedia !== undefined) patch.socialMedia = input.socialMedia;
  if (input.settings !== undefined) patch.settings = input.settings;

  try {
    await db.update(chapter).set(patch).where(eq(chapter.id, id));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throw new ChapterServiceError(
        problems.conflict(`A chapter named "${input.name ?? existing[0].name}" already exists`),
      );
    }
    throw error;
  }

  const updated = await getChapter(id);
  if (!updated) {
    throw new ChapterServiceError(problems.notFound("Chapter not found"));
  }
  return updated;
}

export async function deleteChapter(id: string): Promise<boolean> {
  const deleted = await db.delete(chapter).where(eq(chapter.id, id)).returning({ id: chapter.id });
  return deleted.length > 0;
}
