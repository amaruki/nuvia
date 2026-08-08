import type { Announcement, AnnouncementType } from "@/types/announcement.types";
import type { ArticleStatus } from "@/types/article.types";

import { hydrateDate } from "../use-content-collection";

import { EMPTY_METRICS } from "./constants";
import type { RawContentItem } from "./types";

export function hydrateAnnouncement(raw: RawContentItem): Announcement {
  const ui = raw.ui ?? {};
  const tags = (raw.tags ?? []).map((t) => ({ id: t, name: t, color: "#6366f1", count: 0 }));
  const wordCount = raw.wordCount ?? raw.content.split(/\s+/).filter(Boolean).length;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    content: raw.content,
    status: raw.status as ArticleStatus,
    author: {
      id: raw.author.id,
      name: raw.author.name,
      email: raw.author.email ?? "",
      avatar: raw.author.image,
      role: raw.author.role ?? "member",
    },
    coAuthors: [],
    reviewer: ui.reviewerId
      ? { id: ui.reviewerId, name: ui.reviewerId, email: "", role: "reviewer" }
      : undefined,
    tags,
    featuredImage: raw.featuredImage,
    gallery: raw.gallery,
    attachments: raw.attachments,
    publishedAt: hydrateDate(raw.publishedAt),
    scheduledFor: hydrateDate(raw.scheduledFor),
    lastModified: hydrateDate(raw.updatedAt) ?? new Date(),
    readTime: raw.readTime ?? Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
    estimatedReadingSpeed: 200,
    seo: ui.seo ?? {
      title: raw.title,
      description: raw.excerpt,
      keywords: (raw.tags ?? []).slice(0, 5),
    },
    metrics: { ...EMPTY_METRICS },
    visibility: raw.visibility as Announcement["visibility"],
    allowedRoles: ui.allowedRoles,
    allowedChapters: ui.allowedChapters,
    allowedCommittees: ui.allowedCommittees,
    version: ui.version ?? 1,
    language: ui.language ?? "en",
    commentsEnabled: ui.commentsEnabled ?? true,
    sharingEnabled: ui.sharingEnabled ?? true,
    downloadEnabled: ui.downloadEnabled ?? false,
    isFeatured: ui.isFeatured ?? false,

    // Announcement-specific fields
    type: (raw.type || "general") as AnnouncementType,
    category: "announcements",
    priority: ui.priority ?? "medium",
    targetAudience: ui.targetAudience ?? "all_members",
    targetChapters: ui.targetChapters ?? [],
    targetCommittees: ui.targetCommittees ?? [],
    expiresAt: hydrateDate(ui.expiresAt),
    isPinned: ui.isPinned ?? false,
    isUrgent: ui.isUrgent ?? false,
    requiresAcknowledgment: ui.requiresAcknowledgment ?? false,
    acknowledgmentCount: ui.acknowledgmentCount ?? 0,
    sendEmailNotification: ui.sendEmailNotification ?? true,
    sendPushNotification: ui.sendPushNotification ?? true,
    displayOnHomepage: ui.displayOnHomepage ?? false,
    displayInDashboard: ui.displayInDashboard ?? true,
  };
}
