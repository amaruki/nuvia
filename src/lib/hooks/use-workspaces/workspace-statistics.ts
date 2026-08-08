import type {
  CommitteeWorkspace,
  WorkspaceMonthlyTrend,
  WorkspaceOverallStatistics,
  WorkspaceTypeBreakdown,
} from "@/types/committee";

import { WORKSPACE_TYPE_OPTIONS } from "./constants";

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

export function buildWorkspaceStatistics(
  workspaces: CommitteeWorkspace[],
): WorkspaceOverallStatistics {
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
