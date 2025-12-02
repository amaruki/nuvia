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
  charter: Omit<CommitteeCharter, 'approvalDate' | 'lastReviewed' | 'nextReview'>;
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

// Committee Workspace Types
export interface CommitteeWorkspace {
  id: string;
  committeeId: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  settings: WorkspaceSettings;
  members: WorkspaceMember[];
  documents: WorkspaceDocument[];
  tasks: WorkspaceTask[];
  discussions: WorkspaceDiscussion[];
  meetings: WorkspaceMeeting[];
  activity: WorkspaceActivity[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export type WorkspaceType = "general" | "project" | "document" | "discussion" | "meeting";

export type WorkspaceStatus = "active" | "archived" | "locked";

export interface WorkspaceSettings {
  isPublic: boolean;
  allowGuestAccess: boolean;
  requireApproval: boolean;
  enableNotifications: boolean;
  autoArchiveDays: number;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  memberPermissions: WorkspacePermission[];
}

export interface WorkspacePermission {
  role: CommitteeRole;
  permissions: Permission[];
}

export type Permission = "view" | "edit" | "delete" | "upload" | "download" | "manage_members" | "manage_settings";

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: CommitteeRole;
  permissions: Permission[];
  joinedAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  avatar?: string;
}

export interface WorkspaceDocument {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  version: number;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
  tags: string[];
  category?: string;
  isPublic: boolean;
  downloadCount: number;
  versions: DocumentVersion[];
}

export type DocumentStatus = "draft" | "review" | "approved" | "archived";

export interface DocumentVersion {
  id: string;
  version: number;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeNotes?: string;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  subtasks: WorkspaceTask[];
  parentTaskId?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "completed" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskAttachment {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  attachments?: TaskAttachment[];
}

export interface WorkspaceDiscussion {
  id: string;
  title: string;
  content: string;
  category?: string;
  status: DiscussionStatus;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastReplyAt?: Date;
  lastReplyBy?: string;
  replies: DiscussionReply[];
  attachments: DiscussionAttachment[];
  reactions: DiscussionReaction[];
}

export type DiscussionStatus = "active" | "closed" | "archived";

export interface DiscussionReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
  attachments?: DiscussionAttachment[];
  reactions: DiscussionReaction[];
}

export interface DiscussionAttachment {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DiscussionReaction {
  id: string;
  emoji: string;
  userId: string;
  createdAt: Date;
}

export interface WorkspaceMeeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: string;
  isVirtual: boolean;
  virtualMeetingLink?: string;
  status: MeetingStatus;
  organizer: string;
  attendees: MeetingAttendee[];
  agenda: MeetingAgendaItem[];
  minutes?: string;
  recordingUrl?: string;
  attachments: MeetingAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface MeetingAttendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AttendeeRole;
  status: AttendeeStatus;
  joinedAt?: Date;
  leftAt?: Date;
}

export type AttendeeRole = "organizer" | "presenter" | "attendee";

export type AttendeeStatus = "invited" | "accepted" | "declined" | "tentative" | "attended" | "absent";

export interface MeetingAgendaItem {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  presenter?: string;
  order: number;
  isCompleted: boolean;
  notes?: string;
}

export interface MeetingAttachment {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  type: "agenda" | "presentation" | "minutes" | "other";
}

export interface WorkspaceActivity {
  id: string;
  type: ActivityType;
  actor: string;
  target?: string;
  targetType?: ActivityTargetType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export type ActivityType =
  | "document_uploaded"
  | "document_updated"
  | "task_created"
  | "task_completed"
  | "discussion_started"
  | "discussion_replied"
  | "meeting_scheduled"
  | "meeting_completed"
  | "member_added"
  | "member_removed";

export type ActivityTargetType = "document" | "task" | "discussion" | "meeting" | "member";

export interface WorkspaceFilterOptions {
  type?: WorkspaceType[];
  status?: WorkspaceStatus[];
  memberRole?: CommitteeRole[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface WorkspaceFormData {
  name: string;
  description?: string;
  type: WorkspaceType;
  settings: Partial<WorkspaceSettings>;
}

export interface WorkspaceOverallStatistics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  archivedWorkspaces: number;
  lockedWorkspaces: number;
  totalMembers: number;
  averageMembersPerWorkspace: number;
  totalDocuments: number;
  totalTasks: number;
  totalDiscussions: number;
  totalMeetings: number;
  documentUploadRate: number;
  taskCompletionRate: number;
  meetingAttendanceRate: number;
  topActiveWorkspaces: WorkspacePerformance[];
  typeBreakdown: WorkspaceTypeBreakdown[];
  monthlyTrend: WorkspaceMonthlyTrend[];
}

export interface WorkspacePerformance {
  workspaceId: string;
  workspaceName: string;
  type: WorkspaceType;
  memberCount: number;
  documentCount: number;
  taskCount: number;
  discussionCount: number;
  meetingCount: number;
  activityScore: number;
  engagementRate: number;
}

export interface WorkspaceTypeBreakdown {
  type: WorkspaceType;
  workspaceCount: number;
  memberCount: number;
  documentCount: number;
  taskCount: number;
  averageActivityScore: number;
}

export interface WorkspaceMonthlyTrend {
  month: string;
  workspaceCount: number;
  memberCount: number;
  documentCount: number;
  taskCount: number;
  discussionCount: number;
  meetingCount: number;
}