import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { committee } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import type { Committee } from "@/types/committee";
import { loadCommitteeParts } from "./batch-loaders";
import { pgErrorCode, throwUniqueNameViolation, UNIQUE_VIOLATION, UUID_RE } from "./errors";
import { toCommitteeDto, type CommitteeRow } from "./mappers";
import type { CreateCommitteeInput, UpdateCommitteeInput } from "./schemas";

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Charter input → jsonb column; review dates are managed server-side. */
function charterToJsonb(
  input: CreateCommitteeInput["charter"],
  now: Date,
): Record<string, unknown> {
  const nextReview = new Date(now.getTime());
  nextReview.setFullYear(nextReview.getFullYear() + 1);
  return {
    missionStatement: input.missionStatement,
    responsibilities: input.responsibilities,
    authorityLevel: input.authorityLevel,
    decisionMakingProcess: input.decisionMakingProcess,
    reportingStructure: input.reportingStructure,
    ...(input.termLimits ? { termLimits: input.termLimits } : {}),
    approvalDate: now.toISOString(),
    lastReviewed: now.toISOString(),
    nextReview: nextReview.toISOString(),
  };
}

function blankToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.trim() === "" ? null : value;
}

async function assertCommitteeExists(id: string, notFoundCode: string): Promise<void> {
  const [existing] = await db
    .select({ id: committee.id })
    .from(committee)
    .where(eq(committee.id, id))
    .limit(1);
  if (!existing) {
    throw new BusinessLogicError("Parent committee does not exist", notFoundCode);
  }
}

export async function createCommittee(
  input: CreateCommitteeInput,
  actorId: string,
): Promise<Committee> {
  const parentId = input.parentCommitteeId || null;
  if (parentId) await assertCommitteeExists(parentId, "COMMITTEE_PARENT_NOT_FOUND");

  const now = new Date();
  let row: CommitteeRow;
  try {
    [row] = await db
      .insert(committee)
      .values({
        name: input.name,
        displayName: input.displayName,
        description: blankToNull(input.description),
        purpose: input.purpose,
        status: input.status,
        type: input.type,
        authorityLevel: input.charter.authorityLevel,
        charter: charterToJsonb(input.charter, now),
        contactEmail: input.contactInfo.email,
        contactPhone: blankToNull(input.contactInfo.phone),
        meetingLocation: blankToNull(input.contactInfo.meetingLocation),
        virtualMeetingLink: blankToNull(input.contactInfo.virtualMeetingLink),
        website: blankToNull(input.contactInfo.website),
        parentCommitteeId: parentId,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) throwUniqueNameViolation(input.name);
    throw error;
  }
  return toCommitteeDto(row, [], []);
}

export async function updateCommittee(
  id: string,
  input: UpdateCommitteeInput,
  actorId: string,
): Promise<Committee> {
  if (!UUID_RE.test(id)) throw new NotFoundError("Committee", id);
  const [existing] = await db.select().from(committee).where(eq(committee.id, id)).limit(1);
  if (!existing) throw new NotFoundError("Committee", id);

  const set: Partial<typeof committee.$inferInsert> = { updatedBy: actorId };

  if (input.name !== undefined) set.name = input.name;
  if (input.displayName !== undefined) set.displayName = input.displayName;
  if (input.description !== undefined) set.description = blankToNull(input.description);
  if (input.purpose !== undefined) set.purpose = input.purpose;
  if (input.status !== undefined) set.status = input.status;
  if (input.type !== undefined) set.type = input.type;

  if ("parentCommitteeId" in input) {
    const parentId = input.parentCommitteeId || null;
    if (parentId === id) {
      throw new BusinessLogicError("A committee cannot be its own parent", "COMMITTEE_PARENT_SELF");
    }
    if (parentId) await assertCommitteeExists(parentId, "COMMITTEE_PARENT_NOT_FOUND");
    set.parentCommitteeId = parentId;
  }

  if (input.charter !== undefined) {
    const previous = (
      existing.charter && typeof existing.charter === "object" ? existing.charter : {}
    ) as Record<string, unknown>;
    const now = new Date();
    const approvalDate =
      typeof previous.approvalDate === "string" ? previous.approvalDate : now.toISOString();
    set.authorityLevel = input.charter.authorityLevel;
    set.charter = { ...charterToJsonb(input.charter, now), approvalDate };
  }

  if (input.contactInfo !== undefined) {
    set.contactEmail = input.contactInfo.email;
    set.contactPhone = blankToNull(input.contactInfo.phone);
    set.meetingLocation = blankToNull(input.contactInfo.meetingLocation);
    set.virtualMeetingLink = blankToNull(input.contactInfo.virtualMeetingLink);
    set.website = blankToNull(input.contactInfo.website);
  }

  let row: CommitteeRow;
  try {
    [row] = await db.update(committee).set(set).where(eq(committee.id, id)).returning();
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) {
      throwUniqueNameViolation(input.name ?? existing.name);
    }
    throw error;
  }

  const parts = await loadCommitteeParts([id]);
  return toCommitteeDto(
    row,
    parts.membersByCommittee.get(id) ?? [],
    parts.subCommitteeIdsByCommittee.get(id) ?? [],
  );
}

export async function deleteCommittee(id: string): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;
  const [deleted] = await db
    .delete(committee)
    .where(eq(committee.id, id))
    .returning({ id: committee.id });
  return deleted !== undefined;
}
