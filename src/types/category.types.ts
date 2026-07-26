// Category management types for Nuvia community platform

export type CategoryStatus = "active" | "inactive" | "archived";

export type CategoryType =
  | "content"
  | "article"
  | "announcement"
  | "publication"
  | "event"
  | "forum"
  | "job"
  | "resource";

export type CategoryScope = "global" | "chapter" | "committee";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: CategoryType;
  status: CategoryStatus;
  scope: CategoryScope;

  // Visual properties
  color: string;
  icon?: string;
  emoji?: string;

  // Organization
  parentId?: string; // For nested categories
  order: number; // Sort order

  // Content associations
  contentCount?: number;
  lastUsed?: Date;

  // Access control
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Additional properties
  metadata?: Record<string, any>;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  type: CategoryType;
  status: CategoryStatus;
  scope: CategoryScope;
  color: string;
  icon?: string;
  emoji?: string;
  parentId?: string;
  order: number;
  allowedRoles?: string[];
  allowedChapters?: string[];
  allowedCommittees?: string[];
  metadata?: Record<string, any>;
}

export interface CategoryFilters {
  search?: string;
  type?: CategoryType[];
  status?: CategoryStatus[];
  scope?: CategoryScope[];
  parentId?: string;
  createdBy?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: "name" | "createdAt" | "updatedAt" | "contentCount" | "lastUsed" | "order";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CategoryStatistics {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  archivedCategories: number;

  // By type
  categoriesByType: {
    type: CategoryType;
    count: number;
    contentCount: number;
  }[];

  // By scope
  categoriesByScope: {
    scope: CategoryScope;
    count: number;
  }[];

  // By status
  categoriesByStatus: {
    status: CategoryStatus;
    count: number;
  }[];

  // Most used categories
  mostUsedCategories: {
    categoryId: string;
    name: string;
    contentCount: number;
    type: CategoryType;
    lastUsed: Date;
  }[];

  // Recently created
  recentlyCreated: {
    id: string;
    name: string;
    type: CategoryType;
    createdBy: string;
    createdAt: Date;
  }[];

  // Orphaned categories (no content)
  orphanedCategories: {
    id: string;
    name: string;
    type: CategoryType;
    lastUsed?: Date;
  }[];
}

export interface CategoryUsage {
  categoryId: string;
  categoryName: string;
  contentType: string;
  usageCount: number;
  lastUsed: Date;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

// Export type constants for re-use
export const CATEGORY_TYPES: CategoryType[] = [
  "content",
  "article",
  "announcement",
  "publication",
  "event",
  "forum",
  "job",
  "resource",
] as const;

export const CATEGORY_STATUSES: CategoryStatus[] = ["active", "inactive", "archived"] as const;

export const CATEGORY_SCOPES: CategoryScope[] = ["global", "chapter", "committee"] as const;

// Display information
export const CATEGORY_TYPE_DISPLAY: Record<
  CategoryType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  content: {
    name: "Content",
    description: "General content categories",
    icon: "file-text",
    color: "blue",
  },
  article: {
    name: "Articles",
    description: "Article-specific categories",
    icon: "book-open",
    color: "green",
  },
  announcement: {
    name: "Announcements",
    description: "Announcement categories",
    icon: "megaphone",
    color: "red",
  },
  publication: {
    name: "Publications",
    description: "Publication categories",
    icon: "book",
    color: "purple",
  },
  event: {
    name: "Events",
    description: "Event categories",
    icon: "calendar",
    color: "orange",
  },
  forum: {
    name: "Forums",
    description: "Forum discussion categories",
    icon: "message-square",
    color: "cyan",
  },
  job: {
    name: "Jobs",
    description: "Job posting categories",
    icon: "briefcase",
    color: "emerald",
  },
  resource: {
    name: "Resources",
    description: "Resource categories",
    icon: "folder",
    color: "amber",
  },
};

export const CATEGORY_STATUS_DISPLAY: Record<
  CategoryStatus,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: {
    name: "Active",
    description: "Category is active and available for use",
    icon: "check-circle",
    color: "emerald",
    badgeVariant: "default",
  },
  inactive: {
    name: "Inactive",
    description: "Category is temporarily disabled",
    icon: "pause-circle",
    color: "amber",
    badgeVariant: "outline",
  },
  archived: {
    name: "Archived",
    description: "Category is archived and not in use",
    icon: "archive",
    color: "slate",
    badgeVariant: "secondary",
  },
};

export const CATEGORY_SCOPE_DISPLAY: Record<
  CategoryScope,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  global: {
    name: "Global",
    description: "Available across all chapters and committees",
    icon: "globe",
    color: "blue",
  },
  chapter: {
    name: "Chapter",
    description: "Specific to certain chapters",
    icon: "building",
    color: "green",
  },
  committee: {
    name: "Committee",
    description: "Specific to certain committees",
    icon: "users",
    color: "purple",
  },
};

// Predefined color palette for categories
export const CATEGORY_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Rose", value: "#f43f5e" },
];
