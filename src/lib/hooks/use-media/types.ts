import type {
  Media,
  MediaAnalytics,
  MediaFilters,
  MediaFolder,
  MediaFormData,
  MediaPermission,
  MediaStatistics,
  MediaUploadOptions,
} from "@/types/media";

/** Shape returned by POST /api/v1/media (see media-upload.service.ts). */
export interface MediaUploadRecordDto {
  id: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  checksum: string;
  storagePath: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UseMediaReturn {
  // State
  media: Media[];
  folders: MediaFolder[];
  statistics: MediaStatistics | null;
  loading: boolean;
  error: string | null;
  filters: MediaFilters;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  selectedMedia: string[];

  // Actions
  uploadMedia: (files: File[], options?: MediaUploadOptions) => Promise<void>;
  updateMedia: (id: string, data: Partial<MediaFormData>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  duplicateMedia: (id: string) => Promise<void>;

  // Version management
  createVersion: (mediaId: string, file: File, changelog?: string) => Promise<void>;
  restoreVersion: (mediaId: string, versionId: string) => Promise<void>;
  deleteVersion: (mediaId: string, versionId: string) => Promise<void>;

  // Folder management
  createFolder: (data: Omit<MediaFolder, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateFolder: (id: string, data: Partial<MediaFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Permission management
  grantPermission: (
    mediaId: string,
    permission: Omit<MediaPermission, "id" | "grantedAt">,
  ) => Promise<void>;
  revokePermission: (permissionId: string) => Promise<void>;

  // Analytics
  getAnalytics: (
    mediaId: string,
    dateRange?: { start: Date; end: Date },
  ) => Promise<MediaAnalytics[]>;

  // Bulk operations
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkUpdate: (ids: string[], data: Partial<MediaFormData>) => Promise<void>;
  bulkMove: (ids: string[], folderId: string) => Promise<void>;

  // Import/Export
  exportMedia: (format: "csv" | "json") => Promise<void>;
  importMedia: (file: File) => Promise<void>;

  // Filter and pagination
  updateFilters: (filters: Partial<MediaFilters>) => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;

  // Selection
  setSelectedMedia: (ids: string[]) => void;
  toggleMediaSelection: (id: string) => void;
  clearSelection: () => void;
}
