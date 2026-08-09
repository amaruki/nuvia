import type { Article } from "@/types/article";
import type { Announcement } from "@/types/announcement";
import type { Publication } from "@/types/publication";

/** Collections served by GET /api/v1/content/:collection. */
export type ContentCollectionSlug = "articles" | "announcements" | "publications";

/** Any row rendered by the shared content tables. */
export type ContentItem = Article | Announcement | Publication;

/**
 * Wire author returned inside content rows (see buildAuthor in
 * src/app/api/v1/content/shared.ts). Note the API field is `avatarUrl` —
 * the legacy hydrators read `author.image`, which is why avatars never
 * rendered before; the content tables hydrate from this shape instead.
 */
export interface ContentAuthor {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

/**
 * Minimal wire shape of a content row. The API returns ISO date strings and
 * a loose metadata bag; rows are handed to the legacy hydrators via a cast,
 * so only the fields the tables rely on are spelled out here.
 */
export interface WireContentItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  author?: ContentAuthor;
  isUrgent?: boolean;
  [key: string]: unknown;
}

/** Pagination meta the content/media list endpoints return. */
export interface ContentTableMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
