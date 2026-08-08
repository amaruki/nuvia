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
