export interface Committee {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  purpose: string;
  status: CommitteeStatus;
  type: CommitteeType;
  charter: CommitteeCharter;
  leadership: CommitteeLeadership[];
  members: CommitteeMember[];
  parentCommitteeId?: string;
  subCommitteeIds: string[];
  contactInfo: CommitteeContactInfo;
  metrics: CommitteeMetrics;
  meetings: CommitteeMeeting[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export type CommitteeStatus = "active" | "inactive" | "pending" | "suspended";

export type CommitteeType = "functional" | "special_interest" | "ad_hoc" | "standing" | "executive";

export interface CommitteeCharter {
  missionStatement: string;
  responsibilities: string[];
  authorityLevel: CommitteeAuthorityLevel;
  decisionMakingProcess: string;
  reportingStructure: string;
  termLimits?: {
    chairTerm: number; // in months
    memberTerm: number; // in months
    maxTerms: number;
  };
  approvalDate: Date;
  lastReviewed: Date;
  nextReview: Date;
}

export type CommitteeAuthorityLevel = "advisory" | "operational" | "strategic" | "executive";

export interface CommitteeLeadership {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: CommitteeRole;
  title: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  responsibilities?: string[];
}

export type CommitteeRole = "chair" | "co_chair" | "secretary" | "treasurer" | "member" | "advisor";

export interface CommitteeMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  joinDate: Date;
  endDate?: Date;
  isActive: boolean;
  avatar?: string;
  expertise?: string[];
  contributionLevel: "high" | "medium" | "low";
}

export interface CommitteeContactInfo {
  email: string;
  phone?: string;
  meetingLocation?: string;
  virtualMeetingLink?: string;
  website?: string;
}

export interface CommitteeMetrics {
  memberCount: number;
  activeMembersCount: number;
  meetingAttendanceRate: number;
  goalCompletionRate: number;
  deliverablesCount: number;
  impactScore: number;
  satisfactionScore: number;
  monthlyTrend: CommitteeMonthlyTrend[];
}

export interface CommitteeMonthlyTrend {
  month: string;
  memberCount: number;
  meetingCount: number;
  attendanceRate: number;
  goalsCompleted: number;
  deliverablesCompleted: number;
}

export interface CommitteeMeeting {
  id: string;
  title: string;
  date: Date;
  duration: number; // in minutes
  location: string;
  isVirtual: boolean;
  attendanceCount: number;
  agenda?: string[];
  minutes?: string;
  actionItems?: CommitteeActionItem[];
}

export interface CommitteeActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
}

export interface CommitteeFilterOptions {
  status?: CommitteeStatus[];
  type?: CommitteeType[];
  authorityLevel?: CommitteeAuthorityLevel[];
  memberCountRange?: {
    min: number;
    max: number;
  };
  leadershipRole?: CommitteeRole[];
  search?: string;
}

export interface CommitteeFormData {
  name: string;
  displayName: string;
  description?: string;
  purpose: string;
  status: CommitteeStatus;
  type: CommitteeType;
  charter: Omit<CommitteeCharter, "approvalDate" | "lastReviewed" | "nextReview">;
  contactInfo: CommitteeContactInfo;
  parentCommitteeId?: string;
}

export interface CommitteeOverallStatistics {
  totalCommittees: number;
  activeCommittees: number;
  inactiveCommittees: number;
  pendingCommittees: number;
  suspendedCommittees: number;
  totalMembers: number;
  averageMembersPerCommittee: number;
  totalMeetings: number;
  totalDeliverables: number;
  goalCompletionRate: number;
  topPerformingCommittees: CommitteePerformance[];
  typeBreakdown: CommitteeTypeBreakdown[];
  monthlyTrend: CommitteeMonthlyTrend[];
}

export interface CommitteePerformance {
  committeeId: string;
  committeeName: string;
  type: CommitteeType;
  memberCount: number;
  meetingAttendanceRate: number;
  goalCompletionRate: number;
  deliverablesCount: number;
  impactScore: number;
  satisfactionScore: number;
}

export interface CommitteeTypeBreakdown {
  type: CommitteeType;
  committeeCount: number;
  memberCount: number;
  averageMembersPerCommittee: number;
  totalDeliverables: number;
  averageImpactScore: number;
}
