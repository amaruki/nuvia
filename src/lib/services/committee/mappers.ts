import { committee, committeeMember } from "@/db/schema";
import type {
  Committee,
  CommitteeActionItem,
  CommitteeAuthorityLevel,
  CommitteeCharter,
  CommitteeLeadership,
  CommitteeMeeting,
  CommitteeMember,
  CommitteeMetrics,
  CommitteeMonthlyTrend,
  CommitteeRole,
  CommitteeStatus,
  CommitteeType,
} from "@/types/committee";
import { COMMITTEE_AUTHORITY_LEVELS } from "./schemas";

export type CommitteeRow = typeof committee.$inferSelect;
export type MemberRow = typeof committeeMember.$inferSelect;

// ---------------------------------------------------------------------------
// Row → DTO mapping (jsonb normalization)
// ---------------------------------------------------------------------------

/** Roles rendered in the leadership section; the rest are regular members. */
const LEADERSHIP_ROLES: Record<string, true> = {
  chair: true,
  co_chair: true,
  secretary: true,
  treasurer: true,
  advisor: true,
};

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function toCharter(raw: unknown, row: CommitteeRow): CommitteeCharter {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const approvalDate = toDate(source.approvalDate) ?? row.createdAt;
  const lastReviewed = toDate(source.lastReviewed) ?? row.updatedAt;
  const nextReviewDefault = new Date(lastReviewed.getTime());
  nextReviewDefault.setFullYear(nextReviewDefault.getFullYear() + 1);
  const nextReview = toDate(source.nextReview) ?? nextReviewDefault;
  const termLimitsSource =
    source.termLimits && typeof source.termLimits === "object"
      ? (source.termLimits as Record<string, unknown>)
      : null;
  return {
    missionStatement: typeof source.missionStatement === "string" ? source.missionStatement : "",
    responsibilities: toStringArray(source.responsibilities),
    authorityLevel: (typeof source.authorityLevel === "string" &&
    (COMMITTEE_AUTHORITY_LEVELS as readonly string[]).includes(source.authorityLevel)
      ? source.authorityLevel
      : row.authorityLevel) as CommitteeAuthorityLevel,
    decisionMakingProcess:
      typeof source.decisionMakingProcess === "string" ? source.decisionMakingProcess : "",
    reportingStructure:
      typeof source.reportingStructure === "string" ? source.reportingStructure : "",
    ...(termLimitsSource
      ? {
          termLimits: {
            chairTerm: toNumber(termLimitsSource.chairTerm, 12),
            memberTerm: toNumber(termLimitsSource.memberTerm, 12),
            maxTerms: toNumber(termLimitsSource.maxTerms, 2),
          },
        }
      : {}),
    approvalDate,
    lastReviewed,
    nextReview,
  };
}

function toActionItem(raw: unknown, meetingIndex: number, itemIndex: number): CommitteeActionItem {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const status = ["pending", "in_progress", "completed", "overdue"].includes(
    source.status as string,
  )
    ? (source.status as CommitteeActionItem["status"])
    : "pending";
  const priority = ["low", "medium", "high"].includes(source.priority as string)
    ? (source.priority as CommitteeActionItem["priority"])
    : "medium";
  return {
    id: typeof source.id === "string" ? source.id : `action_${meetingIndex}_${itemIndex}`,
    description: typeof source.description === "string" ? source.description : "",
    assignedTo: typeof source.assignedTo === "string" ? source.assignedTo : "",
    dueDate: toDate(source.dueDate) ?? new Date(0),
    status,
    priority,
  };
}

function toMeetings(raw: unknown): CommitteeMeeting[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index): CommitteeMeeting => {
    const source = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    return {
      id: typeof source.id === "string" ? source.id : `meeting_${index}`,
      title: typeof source.title === "string" ? source.title : "Committee meeting",
      date: toDate(source.date) ?? new Date(0),
      duration: toNumber(source.duration, 0),
      location: typeof source.location === "string" ? source.location : "",
      isVirtual: source.isVirtual === true,
      attendanceCount: toNumber(source.attendanceCount, 0),
      agenda: toStringArray(source.agenda),
      ...(typeof source.minutes === "string" && source.minutes.length > 0
        ? { minutes: source.minutes }
        : {}),
      actionItems: (Array.isArray(source.actionItems) ? source.actionItems : []).map((item, i) =>
        toActionItem(item, index, i),
      ),
    };
  });
}

function toMonthlyTrend(raw: unknown): CommitteeMonthlyTrend[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry): CommitteeMonthlyTrend => {
    const source = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    return {
      month: typeof source.month === "string" ? source.month : "",
      memberCount: toNumber(source.memberCount, 0),
      meetingCount: toNumber(source.meetingCount, 0),
      attendanceRate: toNumber(source.attendanceRate, 0),
      goalsCompleted: toNumber(source.goalsCompleted, 0),
      deliverablesCompleted: toNumber(source.deliverablesCompleted, 0),
    };
  });
}

function toMetrics(raw: unknown, memberRows: MemberRow[]): CommitteeMetrics {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    memberCount: memberRows.length,
    activeMembersCount: memberRows.filter((member) => member.isActive).length,
    meetingAttendanceRate: toNumber(source.meetingAttendanceRate, 0),
    goalCompletionRate: toNumber(source.goalCompletionRate, 0),
    deliverablesCount: toNumber(source.deliverablesCount, 0),
    impactScore: toNumber(source.impactScore, 0),
    satisfactionScore: toNumber(source.satisfactionScore, 0),
    monthlyTrend: toMonthlyTrend(source.monthlyTrend),
  };
}

function toLeadership(row: MemberRow): CommitteeLeadership {
  return {
    id: row.id,
    userId: row.userId ?? "",
    name: row.name,
    email: row.email,
    role: row.role as CommitteeRole,
    title: row.title ?? "",
    startDate: row.joinedAt,
    ...(row.endedAt ? { endDate: row.endedAt } : {}),
    isActive: row.isActive,
    ...(row.responsibilities.length > 0 ? { responsibilities: row.responsibilities } : {}),
  };
}

function toMember(row: MemberRow): CommitteeMember {
  return {
    id: row.id,
    userId: row.userId ?? "",
    name: row.name,
    email: row.email,
    joinDate: row.joinedAt,
    ...(row.endedAt ? { endDate: row.endedAt } : {}),
    isActive: row.isActive,
    ...(row.expertise.length > 0 ? { expertise: row.expertise } : {}),
    contributionLevel:
      row.contributionLevel === "high" ||
      row.contributionLevel === "medium" ||
      row.contributionLevel === "low"
        ? row.contributionLevel
        : "medium",
  };
}

export function toCommitteeDto(
  row: CommitteeRow,
  memberRows: MemberRow[],
  subCommitteeIds: string[],
): Committee {
  return {
    id: row.id,
    name: row.name,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    purpose: row.purpose,
    status: row.status as CommitteeStatus,
    type: row.type as CommitteeType,
    charter: toCharter(row.charter, row),
    leadership: memberRows.filter((m) => m.role in LEADERSHIP_ROLES).map(toLeadership),
    members: memberRows.filter((m) => !(m.role in LEADERSHIP_ROLES)).map(toMember),
    ...(row.parentCommitteeId ? { parentCommitteeId: row.parentCommitteeId } : {}),
    subCommitteeIds,
    contactInfo: {
      email: row.contactEmail,
      ...(row.contactPhone ? { phone: row.contactPhone } : {}),
      ...(row.meetingLocation ? { meetingLocation: row.meetingLocation } : {}),
      ...(row.virtualMeetingLink ? { virtualMeetingLink: row.virtualMeetingLink } : {}),
      ...(row.website ? { website: row.website } : {}),
    },
    metrics: toMetrics(row.metrics, memberRows),
    meetings: toMeetings(row.meetings),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    ...(row.updatedBy ? { updatedBy: row.updatedBy } : {}),
  };
}
