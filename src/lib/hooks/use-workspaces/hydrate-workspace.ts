import type {
  CommitteeWorkspace,
  WorkspaceDiscussion,
  WorkspaceMeeting,
  WorkspaceTask,
} from "@/types/committee";

import type {
  WireWorkspace,
  WireWorkspaceDiscussion,
  WireWorkspaceMeeting,
  WireWorkspaceTask,
} from "./types";

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
