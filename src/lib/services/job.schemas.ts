/**
 * Zod request schemas for /api/v1/jobs routes.
 */

import { z } from "zod";
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
} from "@/types/jobs.types";

const idField = z.uuid();

const salaryField = z
  .number({ error: "Must be a number" })
  .nonnegative({ error: "Must be zero or greater" })
  .max(99_999_999.99, { error: "Too large" })
  .optional();

const salaryConsistency = (data: { salaryMin?: number; salaryMax?: number }) =>
  data.salaryMin === undefined || data.salaryMax === undefined || data.salaryMax >= data.salaryMin;

const salaryConsistencyIssue = {
  message: "Maximum salary must be greater than or equal to minimum salary",
  path: ["salaryMax"],
};

const jobPostingFields = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().max(10_000).optional(),
  responsibilities: z.string().max(10_000).optional(),
  benefits: z.string().max(10_000).optional(),
  categoryId: idField,
  typeId: idField,
  locationId: idField,
  companyId: idField,
  status: z.enum(JOB_STATUSES).default("DRAFT"),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  salaryMin: salaryField,
  salaryMax: salaryField,
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase()
    .default("USD"),
  isRemote: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  applicationDeadline: z.coerce.date().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
});

export const createJobPostingSchema = jobPostingFields.refine(
  salaryConsistency,
  salaryConsistencyIssue,
);

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

/** PATCH accepts any subset; slug and counters are never user-editable here. */
export const updateJobPostingSchema = jobPostingFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(salaryConsistency, salaryConsistencyIssue);

export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;

export const createJobApplicationSchema = z.object({
  coverLetter: z.string().max(10_000, "Cover letter must be at most 10,000 characters").optional(),
  portfolioUrl: z.url({ error: "Portfolio URL must be a valid URL" }).optional(),
  salaryExpectation: z
    .number({ error: "Salary expectation must be a number" })
    .positive()
    .max(99_999_999.99)
    .optional(),
  availability: z.string().max(200).optional(),
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  notes: z.string().max(2_000).optional(),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
