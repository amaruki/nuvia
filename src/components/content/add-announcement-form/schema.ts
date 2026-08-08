import * as z from "zod";

import {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TARGET_AUDIENCES,
} from "@/types/announcement.types";

// Form validation schema
export const announcementFormSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  excerpt: z
    .string()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt must be less than 500 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  type: z.enum(ANNOUNCEMENT_TYPES),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES),
  targetAudience: z.enum(ANNOUNCEMENT_TARGET_AUDIENCES),
  status: z.enum(["draft", "published", "scheduled", "review", "archived"]),
  authorId: z.string().min(1, "Author is required"),
  tagIds: z.array(z.string()).default([]),
  featuredImage: z.string().optional(),
  expiresAt: z.date().optional(),
  isPinned: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  requiresAcknowledgment: z.boolean().default(false),
  sendEmailNotification: z.boolean().default(false),
  sendPushNotification: z.boolean().default(false),
  displayOnHomepage: z.boolean().default(false),
  displayInDashboard: z.boolean().default(false),
  visibility: z.enum([
    "public",
    "members_only",
    "premium_only",
    "chapter_only",
    "committee_only",
  ] as const),
  allowedRoles: z.array(z.string()).default([]),
  allowedChapters: z.array(z.string()).default([]),
  allowedCommittees: z.array(z.string()).default([]),
  commentsEnabled: z.boolean().default(false),
  sharingEnabled: z.boolean().default(true),
  downloadEnabled: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});
