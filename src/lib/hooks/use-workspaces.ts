"use client";

/**
 * D5: workspaces dashboard hook backed by the real workspaces API.
 *
 * - List reads /api/v1/workspaces with the active filters; mutations POST /
 *   PATCH / DELETE and invalidate the list cache.
 * - The API serves ISO date strings; toWorkspaceUi hydrates them to Date at
 *   the wire boundary (nested roster/document/task/discussion/meeting/
 *   activity collections included).
 * - Statistics are computed client-side from the fetched rows — never
 *   invented — the same pattern use-committees uses.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
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
  WorkspaceMonthlyTrend,
  WorkspaceOverallStatistics,
  WorkspaceTask,
  WorkspaceType,
  WorkspaceTypeBreakdown,
} from "@/types/committee.types";

// ---------------------------------------------------------------------------
// Wire → UI mapping (ISO date strings → Date)
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

type WireWorkspaceMember = Omit<WorkspaceMember, "joinedAt" | "lastActiveAt"> & {
  joinedAt: string;
  lastActiveAt: string;
};

type WireDocumentVersion = Omit<DocumentVersion, "uploadedAt"> & { uploadedAt: string };

type WireWorkspaceDocument = Omit<WorkspaceDocument, "uploadedAt" | "updatedAt" | "versions"> & {
  uploadedAt: string;
  updatedAt: string;
  versions: WireDocumentVersion[];
};

type WireTaskAttachment = Omit<TaskAttachment, "uploadedAt"> & { uploadedAt: string };

type WireTaskComment = Omit<TaskComment, "createdAt" | "updatedAt" | "attachments"> & {
  createdAt: string;
  updatedAt?: string;
  attachments?: WireTaskAttachment[];
};

type WireWorkspaceTask = Omit<
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

type WireDiscussionReaction = Omit<DiscussionReaction, "createdAt"> & { createdAt: string };

type WireDiscussionAttachment = Omit<DiscussionAttachment, "uploadedAt"> & { uploadedAt: string };

type WireDiscussionReply = Omit<
  DiscussionReply,
  "createdAt" | "updatedAt" | "attachments" | "reactions"
> & {
  createdAt: string;
  updatedAt?: string;
  attachments?: WireDiscussionAttachment[];
  reactions: WireDiscussionReaction[];
};

type WireWorkspaceDiscussion = Omit<
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

type WireMeetingAttendee = Omit<MeetingAttendee, "joinedAt" | "leftAt"> & {
  joinedAt?: string;
  leftAt?: string;
};

type WireMeetingAttachment = Omit<MeetingAttachment, "uploadedAt"> & { uploadedAt: string };

type WireWorkspaceMeeting = Omit<
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

type WireWorkspaceActivity = Omit<WorkspaceActivity, "createdAt"> & { createdAt: string };

/** ISO strings from the API parse to Date; unparseable values fall back to epoch. */
function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function hydrateTask(raw: WireWorkspaceTask): WorkspaceTask {
  const { createdAt, updatedAt, dueDate, completedAt, attachments, comments, subtasks, ...rest } =
    raw;
  return {
    ...rest,
    createdAt: parseDate(createdAt),
    updatedAt: parseDate(updatedAt),
    ...(dueDate ? { dueDate: parseDate(dueDate) } : {}),
    ...(completedAt ? { completedAt: parseDate(completedAt) } : {}),
    attachments: attachments.map(({ uploadedAt, ...attachment }) => ({
      ...attachment,
      uploadedAt: parseDate(uploadedAt),
    })),
    comments: comments.map(
      ({
        createdAt: commentCreatedAt,
        updatedAt: commentUpdatedAt,
        attachments: commentAttachments,
        ...commentRest
      }) => ({
        ...commentRest,
        createdAt: parseDate(commentCreatedAt),
        ...(commentUpdatedAt ? { updatedAt: parseDate(commentUpdatedAt) } : {}),
        ...(commentAttachments
          ? {
              attachments: commentAttachments.map(({ uploadedAt, ...attachment }) => ({
                ...attachment,
                uploadedAt: parseDate(uploadedAt),
              })),
            }
          : {}),
      }),
    ),
    subtasks: subtasks.map(hydrateTask),
  };
}

function hydrateDiscussion(raw: WireWorkspaceDiscussion): WorkspaceDiscussion {
  const { createdAt, updatedAt, lastReplyAt, replies, attachments, reactions, ...rest } = raw;
  return {
    ...rest,
    createdAt: parseDate(createdAt),
    updatedAt: parseDate(updatedAt),
    ...(lastReplyAt ? { lastReplyAt: parseDate(lastReplyAt) } : {}),
    replies: replies.map(
      ({
        createdAt: replyCreatedAt,
        updatedAt: replyUpdatedAt,
        attachments: replyAttachments,
        reactions: replyReactions,
        ...replyRest
      }) => ({
        ...replyRest,
        createdAt: parseDate(replyCreatedAt),
        ...(replyUpdatedAt ? { updatedAt: parseDate(replyUpdatedAt) } : {}),
        ...(replyAttachments
          ? {
              attachments: replyAttachments.map(({ uploadedAt, ...attachment }) => ({
                ...attachment,
                uploadedAt: parseDate(uploadedAt),
              })),
            }
          : {}),
        reactions: replyReactions.map(({ createdAt: reactionCreatedAt, ...reaction }) => ({
          ...reaction,
          createdAt: parseDate(reactionCreatedAt),
        })),
      }),
    ),
    attachments: attachments.map(({ uploadedAt, ...attachment }) => ({
      ...attachment,
      uploadedAt: parseDate(uploadedAt),
    })),
    reactions: reactions.map(({ createdAt: reactionCreatedAt, ...reaction }) => ({
      ...reaction,
      createdAt: parseDate(reactionCreatedAt),
    })),
  };
}

function hydrateMeeting(raw: WireWorkspaceMeeting): WorkspaceMeeting {
  const { startTime, endTime, createdAt, updatedAt, attendees, attachments, ...rest } = raw;
  return {
    ...rest,
    startTime: parseDate(startTime),
    endTime: parseDate(endTime),
    createdAt: parseDate(createdAt),
    updatedAt: parseDate(updatedAt),
    attendees: attendees.map(({ joinedAt, leftAt, ...attendee }) => ({
      ...attendee,
      ...(joinedAt ? { joinedAt: parseDate(joinedAt) } : {}),
      ...(leftAt ? { leftAt: parseDate(leftAt) } : {}),
    })),
    attachments: attachments.map(({ uploadedAt, ...attachment }) => ({
      ...attachment,
      uploadedAt: parseDate(uploadedAt),
    })),
  };
}

export function toWorkspaceUi(raw: WireWorkspace): CommitteeWorkspace {
  return {
    ...raw,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    members: raw.members.map(({ joinedAt, lastActiveAt, ...member }) => ({
      ...member,
      joinedAt: parseDate(joinedAt),
      lastActiveAt: parseDate(lastActiveAt),
    })),
    documents: raw.documents.map(({ uploadedAt, updatedAt, versions, ...document }) => ({
      ...document,
      uploadedAt: parseDate(uploadedAt),
      updatedAt: parseDate(updatedAt),
      versions: versions.map(({ uploadedAt: versionUploadedAt, ...version }) => ({
        ...version,
        uploadedAt: parseDate(versionUploadedAt),
      })),
    })),
    tasks: raw.tasks.map(hydrateTask),
    discussions: raw.discussions.map(hydrateDiscussion),
    meetings: raw.meetings.map(hydrateMeeting),
    activity: raw.activity.map(({ createdAt, ...activityEntry }) => ({
      ...activityEntry,
      createdAt: parseDate(createdAt),
    })),
  };
}

// ---------------------------------------------------------------------------
// Client-side statistics (computed from the fetched page — never invented)
// ---------------------------------------------------------------------------

const WORKSPACE_TYPE_OPTIONS: WorkspaceType[] = [
  "general",
  "project",
  "document",
  "discussion",
  "meeting",
];

/** 0-100 percentage that stays defined when the denominator is zero. */
function percent(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((100 * numerator) / denominator);
}

/**
 * Engagement metric for rankings: one point per collaboration artifact
 * (document, task, discussion, meeting, activity entry) on the workspace.
 */
function activityScoreOf(workspace: CommitteeWorkspace): number {
  return (
    workspace.documents.length +
    workspace.tasks.length +
    workspace.discussions.length +
    workspace.meetings.length +
    workspace.activity.length
  );
}

function computeStatistics(workspaces: CommitteeWorkspace[]): WorkspaceOverallStatistics {
  const totalWorkspaces = workspaces.length;
  const totalMembers = workspaces.reduce((sum, workspace) => sum + workspace.members.length, 0);
  const allTasks = workspaces.flatMap((workspace) => workspace.tasks);
  const completedTasks = allTasks.filter((task) => task.status === "completed").length;
  const allAttendees = workspaces
    .flatMap((workspace) => workspace.meetings)
    .flatMap((meeting) => meeting.attendees);
  const attended = allAttendees.filter((attendee) => attendee.status === "attended").length;
  const withDocuments = workspaces.filter((workspace) => workspace.documents.length > 0).length;

  const topActiveWorkspaces = workspaces
    .map((workspace) => ({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      type: workspace.type,
      memberCount: workspace.members.length,
      documentCount: workspace.documents.length,
      taskCount: workspace.tasks.length,
      discussionCount: workspace.discussions.length,
      meetingCount: workspace.meetings.length,
      activityScore: activityScoreOf(workspace),
      engagementRate: percent(
        workspace.members.filter((member) => member.isActive).length,
        workspace.members.length,
      ),
    }))
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 5);

  const typeBreakdown: WorkspaceTypeBreakdown[] = WORKSPACE_TYPE_OPTIONS.map((type) => {
    const ofType = workspaces.filter((workspace) => workspace.type === type);
    const totalScore = ofType.reduce((sum, workspace) => sum + activityScoreOf(workspace), 0);
    return {
      type,
      workspaceCount: ofType.length,
      memberCount: ofType.reduce((sum, workspace) => sum + workspace.members.length, 0),
      documentCount: ofType.reduce((sum, workspace) => sum + workspace.documents.length, 0),
      taskCount: ofType.reduce((sum, workspace) => sum + workspace.tasks.length, 0),
      averageActivityScore: ofType.length === 0 ? 0 : Math.round(totalScore / ofType.length),
    };
  });

  const trendBuckets = new Map<string, WorkspaceMonthlyTrend>();
  for (const workspace of workspaces) {
    const month = workspace.createdAt.toISOString().slice(0, 7);
    const bucket = trendBuckets.get(month) ?? {
      month,
      workspaceCount: 0,
      memberCount: 0,
      documentCount: 0,
      taskCount: 0,
      discussionCount: 0,
      meetingCount: 0,
    };
    bucket.workspaceCount += 1;
    bucket.memberCount += workspace.members.length;
    bucket.documentCount += workspace.documents.length;
    bucket.taskCount += workspace.tasks.length;
    bucket.discussionCount += workspace.discussions.length;
    bucket.meetingCount += workspace.meetings.length;
    trendBuckets.set(month, bucket);
  }
  const monthlyTrend = [...trendBuckets.values()].sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalWorkspaces,
    activeWorkspaces: workspaces.filter((workspace) => workspace.status === "active").length,
    archivedWorkspaces: workspaces.filter((workspace) => workspace.status === "archived").length,
    lockedWorkspaces: workspaces.filter((workspace) => workspace.status === "locked").length,
    totalMembers,
    averageMembersPerWorkspace:
      totalWorkspaces === 0 ? 0 : Math.round((totalMembers / totalWorkspaces) * 10) / 10,
    totalDocuments: workspaces.reduce((sum, workspace) => sum + workspace.documents.length, 0),
    totalTasks: allTasks.length,
    totalDiscussions: workspaces.reduce((sum, workspace) => sum + workspace.discussions.length, 0),
    totalMeetings: workspaces.reduce((sum, workspace) => sum + workspace.meetings.length, 0),
    documentUploadRate: percent(withDocuments, totalWorkspaces),
    taskCompletionRate: percent(completedTasks, allTasks.length),
    meetingAttendanceRate: percent(attended, allAttendees.length),
    topActiveWorkspaces,
    typeBreakdown,
    monthlyTrend,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function workspacesQueryPath(filters: WorkspaceFilterOptions): string {
  const params = new URLSearchParams({ limit: "100" });
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.type && filters.type.length > 0) params.set("type", filters.type.join(","));
  if (filters.memberRole && filters.memberRole.length > 0) {
    params.set("memberRole", filters.memberRole.join(","));
  }
  if (filters.dateRange) {
    params.set("createdAfter", filters.dateRange.start.toISOString());
    params.set("createdBefore", filters.dateRange.end.toISOString());
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  return `/api/v1/workspaces?${params.toString()}`;
}

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<WorkspaceFilterOptions>({});

  const listQuery = useQuery({
    queryKey: ["workspaces", "list", filters],
    queryFn: async () => {
      const { data } = await apiFetch<WireWorkspace[]>(workspacesQueryPath(filters));
      return data.map(toWorkspaceUi);
    },
  });

  const invalidateWorkspaces = () => queryClient.invalidateQueries({ queryKey: ["workspaces"] });

  const createMutation = useMutation({
    mutationFn: async (
      input:
        | Omit<CommitteeWorkspace, "id" | "createdAt" | "updatedAt" | "createdBy">
        | WorkspaceFormData,
    ) => {
      const { data } = await apiFetch<WireWorkspace>("/api/v1/workspaces", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return toWorkspaceUi(data);
    },
    onSuccess: () => {
      toast.success("Workspace created");
      invalidateWorkspaces();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to create workspace");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CommitteeWorkspace> | Partial<WorkspaceFormData>;
    }) => {
      const { data } = await apiFetch<WireWorkspace>(`/api/v1/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return toWorkspaceUi(data);
    },
    onSuccess: () => {
      toast.success("Workspace updated");
      invalidateWorkspaces();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update workspace");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/v1/workspaces/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Workspace deleted");
      invalidateWorkspaces();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete workspace");
    },
  });

  const workspaces = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const statistics = useMemo(() => computeStatistics(workspaces), [workspaces]);

  const addWorkspace = async (
    workspaceData:
      | Omit<CommitteeWorkspace, "id" | "createdAt" | "updatedAt" | "createdBy">
      | WorkspaceFormData,
  ) => {
    await createMutation.mutateAsync(workspaceData);
  };

  const updateWorkspace = async (
    id: string,
    updates: Partial<CommitteeWorkspace> | Partial<WorkspaceFormData>,
  ) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteWorkspace = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const toggleWorkspaceStatus = async (id: string, status: "active" | "archived") => {
    await updateMutation.mutateAsync({ id, updates: { status } });
  };

  return {
    // Data
    workspaces,
    statistics,
    loading: listQuery.isPending,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch workspaces. Please try again."
      : null,
    filters,

    // Computed
    activeWorkspaces: useMemo(
      () => workspaces.filter((workspace) => workspace.status === "active"),
      [workspaces],
    ),
    archivedWorkspaces: useMemo(
      () => workspaces.filter((workspace) => workspace.status === "archived"),
      [workspaces],
    ),
    lockedWorkspaces: useMemo(
      () => workspaces.filter((workspace) => workspace.status === "locked"),
      [workspaces],
    ),

    // Actions
    updateFilters: (newFilters: Partial<WorkspaceFilterOptions>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    clearFilters: () => setFilters({}),
    refreshData: invalidateWorkspaces,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    toggleWorkspaceStatus,
  };
}
