import * as z from "zod";

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
