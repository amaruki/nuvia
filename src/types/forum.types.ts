import type { UserRole } from "./dashboard.types";

/**
 * Forum UI types — same shapes the mock data used, now sourced from the
 * /api/v1/forums endpoints. Components import these instead of
 * `src/lib/data/mock-forums.ts`.
 */

export type ForumCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  postCount: number;
  lastPostAt?: string;
  createdAt: string;
};

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  category: {
    id: string;
    name: string;
  };
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED" | "HIDDEN" | "PENDING_REVIEW";
  createdAt: string;
  reportCount: number;
};

export type Report = {
  id: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  reason: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  reportedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  targetContent?: {
    title?: string;
    content: string; // snippet
  };
};

/** Full category row as returned by the API (slug + display name split). */
export type ForumCategoryApi = {
  id: string;
  name: string; // unique slug
  displayName: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  isPrivate: boolean;
  requiredRole: string | null;
  parentId: string | null;
  postCount: number;
  lastPostAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ForumCategoryInput = {
  name: string; // display name; the API derives the slug
  description?: string;
  icon?: string;
  color?: string;
};
