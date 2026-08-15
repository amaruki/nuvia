/**
 * Validation schemas for the Organization singleton (ADR-0007).
 *
 * The settings form always submits every field, so all fields are required
 * here — optional-by-omission PATCH semantics would need partial schemas,
 * which nothing consumes yet. Blank strings on the nullable columns are
 * normalized to null so the database stores real NULLs, not "".
 */

import { z } from "zod";

/** Known IANA timezones, computed at import time (keys are runtime-generated). */
const IANA_TIMEZONES = new Set(Intl.supportedValuesOf("timeZone"));

/** Known ISO 4217 currency codes, computed at import time. */
const SUPPORTED_CURRENCIES = new Set(Intl.supportedValuesOf("currency"));

/** Shared by five fields below: the form submits "" for cleared inputs. */
const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const httpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(200, "Organization name must be at most 200 characters"),

  legalName: z
    .string()
    .max(300, "Legal name must be at most 300 characters")
    .transform(blankToNull),

  logo: z
    .string()
    .max(500, "Logo URL must be at most 500 characters")
    .refine((value) => value.trim() === "" || httpUrl(value.trim()), {
      message: "Logo must be a valid http(s) URL",
    })
    .transform(blankToNull),

  website: z
    .string()
    .max(500, "Website URL must be at most 500 characters")
    .refine((value) => value.trim() === "" || httpUrl(value.trim()), {
      message: "Website must be a valid http(s) URL",
    })
    .transform(blankToNull),

  supportEmail: z
    .string()
    .max(320, "Support email must be at most 320 characters")
    .refine((value) => value.trim() === "" || z.email().safeParse(value.trim()).success, {
      message: "Support email must be a valid email address",
    })
    .transform(blankToNull),

  locale: z
    .string()
    .trim()
    .min(2, "Locale is required")
    .max(35, "Locale must be at most 35 characters")
    .refine(
      (value) => {
        try {
          new Intl.DateTimeFormat(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Locale must be a valid BCP 47 language tag" },
    ),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO 4217 code")
    .transform((value) => value.toUpperCase())
    .refine((value) => SUPPORTED_CURRENCIES.has(value), {
      message: "Currency must be a valid ISO 4217 code",
    }),

  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .max(64, "Timezone must be at most 64 characters")
    .refine((value) => IANA_TIMEZONES.has(value), {
      message: "Timezone must be a valid IANA timezone (e.g. Europe/Berlin)",
    }),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;

/**
 * Membership application dialog (UI-33). Mirrors the request schema of
 * POST /api/v1/membership-applications: name is required (≤200), email must
 * be a valid address (≤320), organization and message are optional notes
 * (≤200 / ≤2000). tierId is supplied by the dialog, never typed by the
 * applicant, so it stays out of the form schema. The dialog maps blank
 * optional fields to null when it builds the payload, as it always has.
 */
export const membershipApplicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name must be at most 200 characters"),

  // Trim before the format check: applicants paste addresses with stray
  // whitespace, and the dialog has always submitted the trimmed value.
  email: z
    .string()
    .trim()
    .min(1, "Contact email is required")
    .pipe(
      z
        .email("Contact email must be a valid email address")
        .max(320, "Contact email must be at most 320 characters"),
    ),

  organization: z.string().trim().max(200, "Organization must be at most 200 characters"),

  message: z.string().trim().max(2000, "Message must be at most 2000 characters"),
});

export type MembershipApplicationFormValues = z.infer<typeof membershipApplicationSchema>;

export type MembershipApplicationFormInput = z.input<typeof membershipApplicationSchema>;

/**
 * Committee create/edit form (organization dashboard form sheet). The API
 * request schemas in src/lib/services/committee/schemas.ts stay the wire
 * contract; this client form schema carries the same rules plus the
 * field-level messages the form displays.
 */
export const committeeFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100, "Display name must be less than 100 characters"),
  description: z.string().optional(),
  purpose: z
    .string()
    .min(10, "Purpose must be at least 10 characters")
    .max(500, "Purpose must be less than 500 characters"),
  status: z.enum(["active", "inactive", "pending", "suspended"] as const),
  type: z.enum(["executive", "functional", "special_interest", "ad_hoc", "standing"] as const),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    meetingLocation: z.string().optional(),
    virtualMeetingLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
  }),
  charter: z.object({
    missionStatement: z
      .string()
      .min(10, "Mission statement must be at least 10 characters")
      .max(500, "Mission statement must be less than 500 characters"),
    responsibilities: z
      .array(z.string().min(5, "Each responsibility must be at least 5 characters"))
      .min(1, "At least one responsibility is required"),
    authorityLevel: z.enum(["advisory", "operational", "strategic", "executive"] as const),
    decisionMakingProcess: z
      .string()
      .min(10, "Decision making process must be at least 10 characters")
      .max(500, "Decision making process must be less than 500 characters"),
    reportingStructure: z
      .string()
      .min(10, "Reporting structure must be at least 10 characters")
      .max(500, "Reporting structure must be less than 500 characters"),
    termLimits: z
      .object({
        chairTerm: z
          .number()
          .min(1, "Chair term must be at least 1 month")
          .max(60, "Chair term must be less than 60 months"),
        memberTerm: z
          .number()
          .min(1, "Member term must be at least 1 month")
          .max(60, "Member term must be less than 60 months"),
        maxTerms: z
          .number()
          .min(1, "Max terms must be at least 1")
          .max(10, "Max terms must be less than 10"),
      })
      .optional(),
  }),
  parentCommitteeId: z.string().optional(),
});

export type CommitteeFormValues = z.infer<typeof committeeFormSchema>;

/** Workspace create/edit form (organization dashboard form sheet). */
export const workspaceFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  type: z.enum(["general", "project", "document", "discussion", "meeting"] as const),
  settings: z.object({
    isPublic: z.boolean(),
    allowGuestAccess: z.boolean(),
    requireApproval: z.boolean(),
    enableNotifications: z.boolean(),
    autoArchiveDays: z
      .number()
      .min(1, "Auto archive must be at least 1 day")
      .max(1095, "Auto archive must be less than 3 years"),
    maxFileSize: z
      .number()
      .min(1, "Max file size must be at least 1MB")
      .max(1000, "Max file size must be less than 1000MB"),
    allowedFileTypes: z.array(z.string()).min(1, "At least one file type must be allowed"),
    memberPermissions: z
      .array(
        z.object({
          role: z.enum([
            "chair",
            "co_chair",
            "secretary",
            "treasurer",
            "member",
            "advisor",
          ] as const),
          permissions: z.array(
            z.enum([
              "view",
              "edit",
              "delete",
              "upload",
              "download",
              "manage_members",
              "manage_settings",
            ] as const),
          ),
        }),
      )
      .min(1, "At least one permission set is required"),
  }),
});

export type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

/** Chapter create/edit form (organization dashboard form sheet). */
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
