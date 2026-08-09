import type {
  Committee,
  CommitteeActionItem,
  CommitteeCharter,
  CommitteeLeadership,
  CommitteeMeeting,
  CommitteeMember,
} from "@/types/committee";

// ---------------------------------------------------------------------------
// Wire shapes (ISO date strings) returned by /api/v1/committees
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/committees: Committee with ISO date strings. */
export interface WireCommittee extends Omit<
  Committee,
  "createdAt" | "updatedAt" | "charter" | "leadership" | "members" | "meetings"
> {
  createdAt: string;
  updatedAt: string;
  charter: Omit<CommitteeCharter, "approvalDate" | "lastReviewed" | "nextReview"> & {
    approvalDate: string;
    lastReviewed: string;
    nextReview: string;
  };
  leadership: (Omit<CommitteeLeadership, "startDate" | "endDate"> & {
    startDate: string;
    endDate?: string;
  })[];
  members: (Omit<CommitteeMember, "joinDate" | "endDate"> & {
    joinDate: string;
    endDate?: string;
  })[];
  meetings: (Omit<CommitteeMeeting, "date" | "actionItems"> & {
    date: string;
    actionItems?: (Omit<CommitteeActionItem, "dueDate"> & { dueDate: string })[];
  })[];
}
