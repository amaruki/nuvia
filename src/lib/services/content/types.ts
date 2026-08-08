import { content } from "@/db/schema";
import type {
  CreateAnnouncementInput,
  CreateArticleInput,
  CreatePublicationInput,
  UpdateAnnouncementInput,
  UpdateArticleInput,
  UpdatePublicationInput,
} from "@/lib/validation/content.validation";

export type ContentCollection = "articles" | "publications" | "announcements";

export const COLLECTION_DB_TYPE: Record<
  ContentCollection,
  "ARTICLE" | "PUBLICATION" | "ANNOUNCEMENT"
> = {
  articles: "ARTICLE",
  publications: "PUBLICATION",
  announcements: "ANNOUNCEMENT",
};

export const COLLECTION_DEFAULT_UI_TYPE: Record<ContentCollection, string> = {
  articles: "article",
  publications: "whitepaper",
  announcements: "system",
};

export const COLLECTION_DEFAULT_CATEGORY: Record<ContentCollection, string> = {
  articles: "General",
  publications: "Reports",
  announcements: "General",
};

export type UiStatus = "draft" | "review" | "published" | "archived" | "scheduled";
export type UiVisibility =
  | "public"
  | "members_only"
  | "premium_only"
  | "chapter_only"
  | "committee_only";

export const UI_STATUS_TO_DB: Record<UiStatus, "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"> = {
  draft: "DRAFT",
  review: "DRAFT",
  published: "PUBLISHED",
  archived: "ARCHIVED",
  scheduled: "SCHEDULED",
};

export const DB_STATUS_TO_UI: Record<string, UiStatus> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "archived",
  SCHEDULED: "scheduled",
};

export const UI_VISIBILITY_TO_DB: Record<
  UiVisibility,
  "PUBLIC" | "MEMBERS_ONLY" | "PREMIUM_MEMBERS" | "SPECIFIC_ROLES" | "PRIVATE"
> = {
  public: "PUBLIC",
  members_only: "MEMBERS_ONLY",
  premium_only: "PREMIUM_MEMBERS",
  chapter_only: "SPECIFIC_ROLES",
  committee_only: "SPECIFIC_ROLES",
};

export const DB_VISIBILITY_TO_UI: Record<string, UiVisibility> = {
  PUBLIC: "public",
  MEMBERS_ONLY: "members_only",
  PREMIUM_MEMBERS: "premium_only",
  SPECIFIC_ROLES: "members_only",
  PRIVATE: "public",
};

export type ContentInput = (
  | CreateArticleInput
  | UpdateArticleInput
  | CreatePublicationInput
  | UpdatePublicationInput
  | CreateAnnouncementInput
  | UpdateAnnouncementInput
) &
  Record<string, unknown>;

export type AuthorFragment = {
  author_name: string | null;
  author_email: string | null;
  author_image: string | null;
  author_profile_photo: string | null;
  author_role: string | null;
};

export type ContentRow = typeof content.$inferSelect & {
  category_name: string | null;
} & AuthorFragment;
