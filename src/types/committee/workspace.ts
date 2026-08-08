import type { WorkspaceActivity } from "./activity";
import type { CommitteeRole } from "./committee";
import type { WorkspaceDiscussion } from "./discussions";
import type { WorkspaceDocument } from "./documents";
import type { WorkspaceMeeting } from "./meetings";
import type { WorkspaceTask } from "./tasks";

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

export type Permission =
  | "view"
  | "edit"
  | "delete"
  | "upload"
  | "download"
  | "manage_members"
  | "manage_settings";

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
