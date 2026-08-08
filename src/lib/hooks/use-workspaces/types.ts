import type {
  CommitteeWorkspace,
  DiscussionAttachment,
  DiscussionReply,
  DiscussionReaction,
  DocumentVersion,
  MeetingAttendee,
  MeetingAttachment,
  TaskAttachment,
  TaskComment,
  WorkspaceActivity,
  WorkspaceDocument,
  WorkspaceDiscussion,
  WorkspaceFilterOptions,
  WorkspaceFormData,
  WorkspaceMeeting,
  WorkspaceMember,
  WorkspaceOverallStatistics,
  WorkspaceTask,
} from "@/types/committee";

// ---------------------------------------------------------------------------
// Wire shapes (ISO date strings) returned by /api/v1/workspaces
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/workspaces: CommitteeWorkspace with ISO date strings. */
export interface WireWorkspace extends Omit<
  CommitteeWorkspace,
  | "createdAt"
  | "updatedAt"
  | "members"
  | "documents"
  | "tasks"
  | "discussions"
  | "meetings"
  | "activity"
> {
  createdAt: string;
  updatedAt: string;
  members: WireWorkspaceMember[];
  documents: WireWorkspaceDocument[];
  tasks: WireWorkspaceTask[];
  discussions: WireWorkspaceDiscussion[];
  meetings: WireWorkspaceMeeting[];
  activity: WireWorkspaceActivity[];
}

export type WireWorkspaceMember = Omit<WorkspaceMember, "joinedAt" | "lastActiveAt"> & {
  joinedAt: string;
  lastActiveAt: string;
};

export type WireDocumentVersion = Omit<DocumentVersion, "uploadedAt"> & { uploadedAt: string };

export type WireWorkspaceDocument = Omit<
  WorkspaceDocument,
  "uploadedAt" | "updatedAt" | "versions"
> & {
  uploadedAt: string;
  updatedAt: string;
  versions: WireDocumentVersion[];
};

export type WireTaskAttachment = Omit<TaskAttachment, "uploadedAt"> & { uploadedAt: string };

export type WireTaskComment = Omit<TaskComment, "createdAt" | "updatedAt" | "attachments"> & {
  createdAt: string;
  updatedAt?: string;
  attachments?: WireTaskAttachment[];
};

export type WireWorkspaceTask = Omit<
  WorkspaceTask,
  "createdAt" | "updatedAt" | "dueDate" | "completedAt" | "attachments" | "comments" | "subtasks"
> & {
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  attachments: WireTaskAttachment[];
  comments: WireTaskComment[];
  subtasks: WireWorkspaceTask[];
};

export type WireDiscussionReaction = Omit<DiscussionReaction, "createdAt"> & { createdAt: string };

export type WireDiscussionAttachment = Omit<DiscussionAttachment, "uploadedAt"> & {
  uploadedAt: string;
};

export type WireDiscussionReply = Omit<
  DiscussionReply,
  "createdAt" | "updatedAt" | "attachments" | "reactions"
> & {
  createdAt: string;
  updatedAt?: string;
  attachments?: WireDiscussionAttachment[];
  reactions: WireDiscussionReaction[];
};

export type WireWorkspaceDiscussion = Omit<
  WorkspaceDiscussion,
  "createdAt" | "updatedAt" | "lastReplyAt" | "replies" | "attachments" | "reactions"
> & {
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
  replies: WireDiscussionReply[];
  attachments: WireDiscussionAttachment[];
  reactions: WireDiscussionReaction[];
};

export type WireMeetingAttendee = Omit<MeetingAttendee, "joinedAt" | "leftAt"> & {
  joinedAt?: string;
  leftAt?: string;
};

export type WireMeetingAttachment = Omit<MeetingAttachment, "uploadedAt"> & { uploadedAt: string };

export type WireWorkspaceMeeting = Omit<
  WorkspaceMeeting,
  "startTime" | "endTime" | "createdAt" | "updatedAt" | "attendees" | "attachments"
> & {
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  attendees: WireMeetingAttendee[];
  attachments: WireMeetingAttachment[];
};

export type WireWorkspaceActivity = Omit<WorkspaceActivity, "createdAt"> & { createdAt: string };

// ---------------------------------------------------------------------------
// Hook contract
// ---------------------------------------------------------------------------

/** Payload accepted by the create mutation / addWorkspace action. */
export type WorkspaceCreateInput =
  | Omit<CommitteeWorkspace, "id" | "createdAt" | "updatedAt" | "createdBy">
  | WorkspaceFormData;

/** Fields the update mutation / updateWorkspace action may change. */
export type WorkspaceUpdateChanges = Partial<CommitteeWorkspace> | Partial<WorkspaceFormData>;

export interface UseWorkspacesReturn {
  // Data
  workspaces: CommitteeWorkspace[];
  statistics: WorkspaceOverallStatistics;
  loading: boolean;
  error: string | null;
  filters: WorkspaceFilterOptions;

  // Computed
  activeWorkspaces: CommitteeWorkspace[];
  archivedWorkspaces: CommitteeWorkspace[];
  lockedWorkspaces: CommitteeWorkspace[];

  // Actions
  updateFilters: (newFilters: Partial<WorkspaceFilterOptions>) => void;
  clearFilters: () => void;
  refreshData: () => void;

  // CRUD operations
  addWorkspace: (workspaceData: WorkspaceCreateInput) => Promise<void>;
  updateWorkspace: (id: string, updates: WorkspaceUpdateChanges) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  toggleWorkspaceStatus: (id: string, status: "active" | "archived") => Promise<void>;
}
