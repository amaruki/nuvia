import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation schemas (mirror src/components/committees/add-committee-form/schema.ts)
// ---------------------------------------------------------------------------

export const COMMITTEE_STATUSES = ["active", "inactive", "pending", "suspended"] as const;
export const COMMITTEE_TYPES = [
  "executive",
  "functional",
  "special_interest",
  "ad_hoc",
  "standing",
] as const;
export const COMMITTEE_AUTHORITY_LEVELS = [
  "advisory",
  "operational",
  "strategic",
  "executive",
] as const;
export const COMMITTEE_ROLES = [
  "chair",
  "co_chair",
  "secretary",
  "treasurer",
  "member",
  "advisor",
] as const;

const optionalUrl = z.union([z.string().url().max(2048), z.literal("")]).optional();

export const committeeTermLimitsSchema = z.object({
  chairTerm: z.number().int().min(1).max(60),
  memberTerm: z.number().int().min(1).max(60),
  maxTerms: z.number().int().min(1).max(10),
});

export const committeeCharterInputSchema = z.object({
  missionStatement: z.string().min(10).max(500),
  responsibilities: z.array(z.string().min(5)).min(1),
  authorityLevel: z.enum(COMMITTEE_AUTHORITY_LEVELS),
  decisionMakingProcess: z.string().min(10).max(500),
  reportingStructure: z.string().min(10).max(500),
  termLimits: committeeTermLimitsSchema.optional(),
});

export const committeeContactInfoInputSchema = z.object({
  email: z.string().email().max(320),
  phone: z.string().max(50).optional(),
  meetingLocation: z.string().max(255).optional(),
  virtualMeetingLink: optionalUrl,
  website: optionalUrl,
});

export const createCommitteeSchema = z.object({
  name: z.string().min(3).max(50),
  displayName: z.string().min(3).max(100),
  description: z.string().optional(),
  purpose: z.string().min(10).max(500),
  status: z.enum(COMMITTEE_STATUSES).default("pending"),
  type: z.enum(COMMITTEE_TYPES).default("functional"),
  parentCommitteeId: z.union([z.string().uuid(), z.literal("")]).optional(),
  charter: committeeCharterInputSchema,
  contactInfo: committeeContactInfoInputSchema,
});
export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>;

export const updateCommitteeSchema = z
  .object({
    name: z.string().min(3).max(50),
    displayName: z.string().min(3).max(100),
    description: z.string().optional(),
    purpose: z.string().min(10).max(500),
    status: z.enum(COMMITTEE_STATUSES),
    type: z.enum(COMMITTEE_TYPES),
    parentCommitteeId: z
      .union([z.string().uuid(), z.literal("")])
      .nullable()
      .optional(),
    charter: committeeCharterInputSchema,
    contactInfo: committeeContactInfoInputSchema,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one committee field must be provided",
  });
export type UpdateCommitteeInput = z.infer<typeof updateCommitteeSchema>;
