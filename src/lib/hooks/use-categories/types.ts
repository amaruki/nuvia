// ---------------------------------------------------------------------------
// Wire shapes (ISO date strings) returned by /api/v1/content/categories
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/content/categories: Category with ISO date strings. */
export interface RawCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  scope: string;
  status: "active" | "inactive" | "archived";
  color?: string;
  icon?: string;
  emoji?: string;
  order: number;
  parentId?: string;
  contentCount: number;
  allowedRoles: string[];
  allowedChapters: string[];
  allowedCommittees: string[];
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}
