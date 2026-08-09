/**
 * Shared building blocks for the five content admin tables (articles,
 * announcements, publications, categories, media) on the DataTable layer.
 * The legacy per-collection table components were replaced by these.
 */
export * from "./types";
export {
  useContentTableQuery,
  toArticle,
  toAnnouncement,
  toPublication,
  type ContentTableQuery,
  type UseContentTableQueryOptions,
} from "./use-content-table-query";
export { useCategoriesTableQuery, type CategoriesTableQuery } from "./use-categories-table-query";
export { useMediaTableQuery, type MediaTableQuery } from "./use-media-table-query";
export { AuthorCell, DateCell, TruncateText } from "./cells";
export { ContentRowActions, type ContentRowActionsProps } from "./content-row-actions";
export { ContentTableToolbar, type ContentTableToolbarProps } from "./content-table-toolbar";
export {
  ContentBulkBar,
  type ContentBulkAction,
  type ContentBulkBarProps,
} from "./content-bulk-bar";
export { createArticlesColumns, type ArticlesColumnHandlers } from "./articles-columns";
export {
  createAnnouncementsColumns,
  type AnnouncementsColumnHandlers,
} from "./announcements-columns";
export { createPublicationsColumns, type PublicationsColumnHandlers } from "./publications-columns";
export { createCategoriesColumns, type CategoriesColumnHandlers } from "./categories-columns";
export { createMediaColumns, type MediaColumnHandlers } from "./media-columns";
