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

// Constant lists and display metadata live in ./category-display.types and are
// re-exported here so every existing specifier and named export keeps working.
export {
  CATEGORY_TYPES,
  CATEGORY_STATUSES,
  CATEGORY_SCOPES,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_STATUS_DISPLAY,
  CATEGORY_SCOPE_DISPLAY,
  CATEGORY_COLORS,
} from "./category-display.types";
