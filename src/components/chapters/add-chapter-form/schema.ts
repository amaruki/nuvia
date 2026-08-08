import * as z from "zod";

export const chapterFormSchema = z.object({
  name: z
    .string()
    .min(3, "Chapter name must be at least 3 characters")
    .max(50, "Chapter name must be less than 50 characters"),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100, "Display name must be less than 100 characters"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  location: z.object({
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State must be at least 2 characters"),
    country: z.string().min(2, "Country must be at least 2 characters"),
    postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
    timezone: z.string().min(1, "Timezone is required"),
    region: z.string().min(2, "Region must be at least 2 characters"),
  }),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    address: z.string().min(5, "Address must be at least 5 characters"),
    mailingAddress: z.string().optional(),
  }),
  socialMedia: z.object({
    facebook: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    instagram: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
    youtube: z.string().url("Invalid YouTube URL").optional().or(z.literal("")),
  }),
  settings: z.object({
    allowOnlineRegistration: z.boolean(),
    requireApproval: z.boolean(),
    membershipDues: z.number().min(0, "Membership dues must be a positive number"),
    meetingFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
    meetingDay: z.string().optional(),
    meetingTime: z.string().optional(),
    autoRenewMembership: z.boolean(),
    sendReminders: z.boolean(),
    publicDirectory: z.boolean(),
  }),
  parentChapterId: z.string().optional(),
});

export type ChapterFormValues = z.infer<typeof chapterFormSchema>;
