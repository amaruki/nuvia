import type {
  Publication,
  PublicationFilters,
  PublicationFormData,
  PublicationStatistics,
} from "@/types/publication.types";

export interface RawContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: string;
  category: string;
  status: string;
  visibility: string;
  featuredImage?: string;
  gallery?: string[];
  attachments?: unknown[];
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
  difficulty?: string;
  tags?: string[];
  ui?: {
    version?: number;
    language?: string;
    isFeatured?: boolean;
    isPinned?: boolean;
    priority?: number;
    commentsEnabled?: boolean;
    sharingEnabled?: boolean;
    downloadEnabled?: boolean;
    seo?: {
      title: string;
      description: string;
      keywords: string[];
      ogImage?: string;
    };
  };
}

export interface UsePublicationsReturn {
  // Data
  publications: Publication[];
  statistics: PublicationStatistics | null;
  filteredPublications: Publication[];

  // State
  loading: boolean;
  error: string | null;
  filters: PublicationFilters;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;

  // Actions
  refreshData: () => void;
  updateFilters: (filters: Partial<PublicationFilters>) => void;
  clearFilters: () => void;

  // CRUD operations
  getPublication: (id: string) => Publication | null;
  addPublication: (data: PublicationFormData) => Promise<Publication>;
  updatePublication: (id: string, data: Partial<PublicationFormData>) => Promise<Publication>;
  deletePublication: (id: string) => Promise<void>;
  duplicatePublication: (id: string) => Promise<Publication>;

  // Status management
  publishPublication: (id: string) => Promise<void>;
  archivePublication: (id: string) => Promise<void>;
  schedulePublication: (id: string, date: Date) => Promise<void>;
  unpublishPublication: (id: string) => Promise<void>;

  // Bulk operations
  bulkPublish: (ids: string[]) => Promise<void>;
  bulkArchive: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;

  // Utility
  exportPublications: (format: "csv" | "json" | "pdf") => void;
  importPublications: (file: File) => Promise<void>;
}
