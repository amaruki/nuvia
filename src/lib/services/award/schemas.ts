import { z } from "zod";

const awardProgramStatusSchema = z.enum(["draft", "open", "closed", "archived"]);
const awardCategorySchema = z.enum([
  "achievement",
  "service",
  "leadership",
  "innovation",
  "scholarship",
  "lifetime_achievement",
]);
const awardNominationStatusSchema = z.enum(["pending", "under_review", "approved", "rejected"]);

export const createAwardProgramSchema = z
  .object({
    name: z.string().min(3).max(80),
    description: z.string().max(2000).optional(),
    category: awardCategorySchema.default("achievement"),
    status: awardProgramStatusSchema.default("draft"),
    criteria: z.array(z.string().min(3).max(500)).max(20).default([]),
    openDate: z.coerce.date().optional(),
    closeDate: z.coerce.date().optional(),
    awardDate: z.coerce.date().optional(),
  })
  .refine((value) => !value.openDate || !value.closeDate || value.openDate <= value.closeDate, {
    message: "openDate must be before or equal to closeDate",
    path: ["closeDate"],
  });

export const updateAwardProgramSchema = z
  .object({
    name: z.string().min(3).max(80).optional(),
    description: z.string().max(2000).nullable().optional(),
    category: awardCategorySchema.optional(),
    // Plain optional (not .partial()) so an empty PATCH cannot reset fields.
    status: awardProgramStatusSchema.optional(),
    criteria: z.array(z.string().min(3).max(500)).max(20).optional(),
    openDate: z.union([z.null(), z.coerce.date()]).optional(),
    closeDate: z.union([z.null(), z.coerce.date()]).optional(),
    awardDate: z.union([z.null(), z.coerce.date()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const createAwardNominationSchema = z.object({
  programId: z.uuid(),
  // Accept uuid, "" or null → normalize to null (nominee without an account).
  userId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  nomineeName: z.string().min(2).max(120),
  nomineeEmail: z.string().email(),
  nominatorName: z.string().min(2).max(120),
  nominatorEmail: z.string().email(),
  status: awardNominationStatusSchema.default("pending"),
  statement: z.string().max(5000).optional(),
});

/** Nominations are edited through review: status transitions + statement. */
export const updateAwardNominationSchema = z
  .object({
    status: awardNominationStatusSchema.optional(),
    statement: z.string().max(5000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateAwardProgramInput = z.infer<typeof createAwardProgramSchema>;
export type UpdateAwardProgramInput = z.infer<typeof updateAwardProgramSchema>;
export type CreateAwardNominationInput = z.infer<typeof createAwardNominationSchema>;
export type UpdateAwardNominationInput = z.infer<typeof updateAwardNominationSchema>;
