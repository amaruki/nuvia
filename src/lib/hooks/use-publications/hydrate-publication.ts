import type {
  Publication,
  PublicationCategory,
  PublicationStatus,
  PublicationType,
} from "@/types/publication.types";

import { hydrateDate } from "../use-content-collection";

import { EMPTY_METRICS } from "./constants";
import type { RawContentItem } from "./types";

export function hydratePublication(raw: RawContentItem): Publication {
  const ui = raw.ui ?? {};
  const tags = (raw.tags ?? []).map((t) => ({ id: t, name: t, color: "#6366f1", count: 0 }));
  const wordCount = raw.wordCount ?? raw.content.split(/\s+/).filter(Boolean).length;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    content: raw.content,
    type: raw.type as PublicationType,
    category: raw.category as PublicationCategory,
    status: raw.status as PublicationStatus,
    author: {
      id: raw.author.id,
      name: raw.author.name,
      email: raw.author.email ?? "",
      avatar: raw.author.image,
      role: raw.author.role ?? "member",
    },
    coAuthors: [],
    tags,
    featuredImage: raw.featuredImage,
    gallery: raw.gallery,
    publishedAt: hydrateDate(raw.publishedAt),
    scheduledFor: hydrateDate(raw.scheduledFor),
    lastModified: hydrateDate(raw.updatedAt) ?? new Date(),
    readTime: raw.readTime ?? Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
    difficulty: (raw.difficulty ?? "beginner") as Publication["difficulty"],
    seo: ui.seo ?? {
      title: raw.title,
      description: raw.excerpt,
      keywords: (raw.tags ?? []).slice(0, 5),
    },
    metrics: { ...EMPTY_METRICS },
    visibility: raw.visibility as Publication["visibility"],
    version: ui.version ?? 1,
    language: ui.language ?? "en",
    commentsEnabled: ui.commentsEnabled ?? true,
    sharingEnabled: ui.sharingEnabled ?? true,
    downloadEnabled: ui.downloadEnabled ?? true,
    isFeatured: ui.isFeatured ?? false,
    isPinned: ui.isPinned ?? false,
    priority: ui.priority ?? 50,
  };
}
