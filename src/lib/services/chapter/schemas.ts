// ---------------------------------------------------------------------------
// Validation schemas (mirror the add-chapter form; the API accepts a small
// superset — memberCount and establishedDate — for programmatic callers)
// ---------------------------------------------------------------------------

import { z } from "zod";

const locationSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(3),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  timezone: z.string().min(1),
  region: z.string().min(2),
});

const contactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().min(5),
  mailingAddress: z.string().max(200).optional(),
});

const socialMediaSchema = z.object({
  facebook: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
});

const settingsSchema = z.object({
  allowOnlineRegistration: z.boolean(),
  requireApproval: z.boolean(),
  membershipDues: z.number().min(0),
  meetingFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
  meetingDay: z.string().max(20).optional(),
  meetingTime: z.string().max(10).optional(),
  autoRenewMembership: z.boolean(),
  sendReminders: z.boolean(),
  publicDirectory: z.boolean(),
});

const chapterStatusSchema = z.enum(["active", "inactive", "pending", "suspended"]);

export const createChapterSchema = z.object({
  name: z.string().min(3).max(50),
  displayName: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  status: chapterStatusSchema.default("pending"),
  location: locationSchema,
  contactInfo: contactInfoSchema,
  socialMedia: socialMediaSchema,
  settings: settingsSchema,
  parentChapterId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  memberCount: z.number().int().min(0).optional(),
  establishedDate: z.coerce.date().optional(),
});

export const updateChapterSchema = createChapterSchema
  .partial()
  // .partial() keeps zod defaults live, which would let an empty {} PATCH
  // reset status — override with a plain optional for updates.
  .extend({ status: chapterStatusSchema.optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
