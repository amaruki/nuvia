/**
 * Public committee reads — ring-0 projection for the `/committees` pages
 * (plan item UI-29; exposure audit row "Chapters and committees"; D15).
 *
 * Audience-ready state mapping (lowercase text statuses, documented per the
 * plan): unlike chapters — whose `status` is a SCREAMING_SNAKE pg enum —
 * committees store `status` as lowercase free text in a plain `text` column
 * defaulting to "pending" (src/db/schema/committees.ts). The spellings in
 * use are COMMITTEE_STATUSES in ./schemas.ts (mirrored by the CommitteeStatus
 * UI type and the backoffice filter options):
 *
 *   "active" | "inactive" | "pending" | "suspended"
 *
 * ONLY lowercase "active" is audience-ready (R1); the other three states are
 * not public and stay backoffice-only. This is the committee analogue of the
 * chapters' ACTIVE-only rule, spelled lowercase.
 *
 * Ring 0 has no auth gate — these functions ARE the security boundary:
 * - The status filter lives in the SQL; the detail read re-checks it.
 * - Projections are field allow-lists (R2). Roster rows (committee_members)
 *   contribute names/titles/roles of ACTIVE leadership only: roster emails
 *   are on the never-public list and are never even selected, regular
 *   "member"-role rows and inactive members are filtered out entirely (D15:
 *   leadership names public, rosters private).
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { committee, committeeMember } from "@/db/schema";
import type { CommitteeRole, CommitteeType } from "@/types/committee";
import { UUID_RE } from "./errors";

/** The only audience-ready committee status (lowercase text column). */
const PUBLIC_STATUS = "active";

/** Leadership roles rendered publicly, in display order. */
const LEADERSHIP_RANK: Record<string, number> = {
  chair: 0,
  co_chair: 1,
  secretary: 2,
  treasurer: 3,
  advisor: 4,
};

/** Human titles when a leadership row has no free-text title. */
const ROLE_TITLE_FALLBACK: Record<string, string> = {
  chair: "Chair",
  co_chair: "Co-Chair",
  secretary: "Secretary",
  treasurer: "Treasurer",
  advisor: "Advisor",
};

// ---------------------------------------------------------------------------
// Public projection types (field allow-lists, R2)
// ---------------------------------------------------------------------------

export interface PublicCommitteeLeader {
  name: string;
  title: string;
  role: CommitteeRole;
}

export interface PublicCommitteeSummary {
  id: string;
  displayName: string;
  description?: string;
  purpose: string;
  type: CommitteeType;
  memberCount: number;
}

export interface PublicCommitteeContact {
  email: string;
  phone?: string;
  meetingLocation?: string;
  virtualMeetingLink?: string;
  website?: string;
}

export interface PublicCommittee extends PublicCommitteeSummary {
  contact: PublicCommitteeContact;
  leadership: PublicCommitteeLeader[];
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Public committee list — "active" committees only (R1), ordered by display
 * name. Called from the `/committees` server component; never from `/api/v1`.
 */
export async function listPublicCommittees(): Promise<PublicCommitteeSummary[]> {
  const rows = await db
    .select({
      id: committee.id,
      displayName: committee.displayName,
      description: committee.description,
      purpose: committee.purpose,
      type: committee.type,
      memberCount: sql<number>`(select count(*) from ${committeeMember} where ${committeeMember.committeeId} = ${committee.id})`,
    })
    .from(committee)
    .where(eq(committee.status, PUBLIC_STATUS))
    .orderBy(asc(committee.displayName));

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    purpose: row.purpose,
    type: row.type as CommitteeType,
    memberCount: Number(row.memberCount),
  }));
}

/**
 * Public committee detail — returns null for unknown ids and for any
 * committee whose lowercase text status is not "active", so non-audience-
 * ready units are unreachable (R1).
 */
export async function getPublicCommittee(id: string): Promise<PublicCommittee | null> {
  if (!UUID_RE.test(id)) return null;

  const rows = await db
    .select({
      row: committee,
      memberCount: sql<number>`(select count(*) from ${committeeMember} where ${committeeMember.committeeId} = ${committee.id})`,
    })
    .from(committee)
    .where(and(eq(committee.id, id), eq(committee.status, PUBLIC_STATUS)))
    .limit(1);
  const found = rows[0];
  if (!found) return null;
  const row = found.row;

  // Allow-listed roster read: name/title/role of active members only.
  // Emails are never selected for ring 0.
  const memberRows = await db
    .select({
      name: committeeMember.name,
      title: committeeMember.title,
      role: committeeMember.role,
    })
    .from(committeeMember)
    .where(and(eq(committeeMember.committeeId, id), eq(committeeMember.isActive, true)))
    .orderBy(asc(committeeMember.name));

  const leadership: PublicCommitteeLeader[] = memberRows
    .filter((member) => member.role in LEADERSHIP_RANK)
    .sort((a, b) => LEADERSHIP_RANK[a.role] - LEADERSHIP_RANK[b.role])
    .map((member) => ({
      name: member.name,
      title: member.title ?? ROLE_TITLE_FALLBACK[member.role] ?? "",
      role: member.role as CommitteeRole,
    }));

  return {
    id: row.id,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    purpose: row.purpose,
    type: row.type as CommitteeType,
    memberCount: Number(found.memberCount),
    contact: {
      email: row.contactEmail,
      ...(row.contactPhone ? { phone: row.contactPhone } : {}),
      ...(row.meetingLocation ? { meetingLocation: row.meetingLocation } : {}),
      ...(row.virtualMeetingLink ? { virtualMeetingLink: row.virtualMeetingLink } : {}),
      ...(row.website ? { website: row.website } : {}),
    },
    leadership,
  };
}
