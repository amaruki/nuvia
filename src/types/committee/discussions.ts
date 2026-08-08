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
