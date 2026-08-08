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
