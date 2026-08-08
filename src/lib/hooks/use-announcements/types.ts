import type {
  Announcement,
  AnnouncementFilters,
  AnnouncementFormData,
  AnnouncementPriority,
  AnnouncementStatistics,
  AnnouncementTargetAudience,
} from "@/types/announcement.types";

export interface RawContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: string;
  status: string;
  visibility: string;
  featuredImage?: string;
  gallery?: string[];
  attachments?: { id: string; name: string; url: string; size: number; type: string }[];
  author: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    role?: string;
  };
  publishedAt?: string | null;
  scheduledFor?: string | null;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  wordCount?: number;
  tags?: string[];
  ui?: {
    version?: number;
    language?: string;
    reviewerId?: string;
    priority?: AnnouncementPriority;
    targetAudience?: AnnouncementTargetAudience;
    targetChapters?: string[];
    targetCommittees?: string[];
    expiresAt?: string | null;
    isPinned?: boolean;
    isUrgent?: boolean;
    requiresAcknowledgment?: boolean;
    acknowledgmentCount?: number;
    sendEmailNotification?: boolean;
    sendPushNotification?: boolean;
    displayOnHomepage?: boolean;
    displayInDashboard?: boolean;
    allowedRoles?: string[];
    allowedChapters?: string[];
    allowedCommittees?: string[];
    commentsEnabled?: boolean;
    sharingEnabled?: boolean;
    downloadEnabled?: boolean;
    isFeatured?: boolean;
    seo?: {
      title: string;
      description: string;
      keywords: string[];
      ogImage?: string;
      canonicalUrl?: string;
    };
  };
}

export interface UseAnnouncementsReturn {
  // Data
  announcements: Announcement[];
  statistics: AnnouncementStatistics | null;
  filteredAnnouncements: Announcement[];

  // State
  loading: boolean;
  error: string | null;
  filters: AnnouncementFilters;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;

  // Actions
  refreshData: () => void;
  updateFilters: (filters: Partial<AnnouncementFilters>) => void;
  clearFilters: () => void;

  // CRUD operations
  getAnnouncement: (id: string) => Announcement | null;
  addAnnouncement: (data: AnnouncementFormData) => Promise<Announcement>;
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  duplicateAnnouncement: (id: string) => Promise<Announcement>;

  // Status management
  publishAnnouncement: (id: string) => Promise<void>;
  archiveAnnouncement: (id: string) => Promise<void>;
  scheduleAnnouncement: (id: string, date: Date) => Promise<void>;
  unpublishAnnouncement: (id: string) => Promise<void>;
  reviewAnnouncement: (id: string, reviewerId: string) => Promise<void>;

  // Bulk operations
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkReview: (ids: string[], reviewerId: string) => Promise<void>;

  // Utility
  exportAnnouncements: (format: "csv" | "json" | "pdf") => void;
  importAnnouncements: (file: File) => Promise<void>;
}
