import { asc, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { committee, committeeMember } from "@/db/schema";
import type { MemberRow } from "./mappers";

// ---------------------------------------------------------------------------
// Batch loaders
// ---------------------------------------------------------------------------

export async function loadCommitteeParts(committeeIds: string[]): Promise<{
  membersByCommittee: Map<string, MemberRow[]>;
  subCommitteeIdsByCommittee: Map<string, string[]>;
}> {
  const membersByCommittee = new Map<string, MemberRow[]>();
  const subCommitteeIdsByCommittee = new Map<string, string[]>();
  if (committeeIds.length === 0) return { membersByCommittee, subCommitteeIdsByCommittee };

  const memberRows = await db
    .select()
    .from(committeeMember)
    .where(inArray(committeeMember.committeeId, committeeIds))
    .orderBy(asc(committeeMember.joinedAt), asc(committeeMember.id));
  for (const row of memberRows) {
    const list = membersByCommittee.get(row.committeeId) ?? [];
    list.push(row);
    membersByCommittee.set(row.committeeId, list);
  }

  const childRows = await db
    .select({ id: committee.id, parentCommitteeId: committee.parentCommitteeId })
    .from(committee)
    .where(inArray(committee.parentCommitteeId, committeeIds));
  for (const row of childRows) {
    if (!row.parentCommitteeId) continue;
    const list = subCommitteeIdsByCommittee.get(row.parentCommitteeId) ?? [];
    list.push(row.id);
    subCommitteeIdsByCommittee.set(row.parentCommitteeId, list);
  }

  return { membersByCommittee, subCommitteeIdsByCommittee };
}
