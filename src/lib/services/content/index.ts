/**
 * Content service — the single data-access layer for articles, publications,
 * and announcements (all rows live in the `content` table, discriminated by
 * the `type` column) plus the content category taxonomy.
 *
 * UI-only fields that have no dedicated column round-trip through
 * `content.metadata.ui` so clients get back exactly what they stored.
 */

export { ContentApiError } from "./errors";
export type { ContentCollection } from "./types";
export type { ContentActor } from "./lifecycle";
export { getContentItem, listContent, type ContentReadScope } from "./queries";
export { createContentItem, deleteContentItem, updateContentItem } from "./mutations";
export { sweepScheduledContent, type SweepScheduledContentResult } from "./scheduler";
export {
  createCategoryItem,
  deleteCategoryItem,
  getCategoryItem,
  listCategories,
  updateCategoryItem,
} from "./categories";
