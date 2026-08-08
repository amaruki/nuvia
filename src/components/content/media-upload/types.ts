import type { MediaUploadOptions } from "@/types/media";

export interface MediaUploadProps {
  onUpload: (files: File[], options: MediaUploadOptions) => Promise<void>;
  onClose: () => void;
  className?: string;
}

export type UploadFileStatus = "pending" | "uploading" | "success" | "error";

export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: UploadFileStatus;
  error?: string;
}
