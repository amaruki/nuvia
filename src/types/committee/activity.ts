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
