/**
 * Job board validation schemas using Zod.
 *
 * Client-safe companions of the API request schemas in
 * src/lib/services/job.schemas.ts (used by src/app/api/v1/jobs/*).
 */

import { z } from "zod";
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES } from "@/types/jobs.types";

// Job application form schema (client-side validation for the apply form)
export const jobApplicationSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .max(5000, "Cover letter must be at most 5000 characters")
    .optional()
    .or(z.literal("")),
  portfolioUrl: z
    .string()
    .url("Enter a valid URL (including https://)")
    .optional()
    .or(z.literal("")),
  salaryExpectation: z.coerce
    .number()
    .min(0, "Salary must not be negative")
    .optional()
    .or(z.literal("")),
  availability: z
    .string()
    .trim()
    .max(200, "Availability must be at most 200 characters")
    .optional(),
});

// Type for the validated job application form values
export type JobApplicationFormValues = z.infer<typeof jobApplicationSchema>;

// Input type for the form (z.coerce accepts unknown input values)
export type JobApplicationFormInput = z.input<typeof jobApplicationSchema>;

// ---------------------------------------------------------------------------
// Job posting form (dashboard create/edit)
// ---------------------------------------------------------------------------
// Mirrors the client-safe constraints of createJobPostingSchema using
// form-friendly shapes: salaries are text-input strings, tags are a
// comma-separated string, and the deadline stays a YYYY-MM-DD string until
// buildPayload converts it for the API.

const MAX_SECTION_LENGTH = 10_000;
const MAX_SALARY = 99_999_999.99;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

const salaryString = z.string().superRefine((value, ctx) => {
  if (value === "") return;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    ctx.addIssue({ code: "custom", message: "Salary must be a number" });
    return;
  }
  if (Number(value) > MAX_SALARY) {
    ctx.addIssue({ code: "custom", message: "Salary is too large" });
  }
});

export const jobPostingSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be at most 200 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    requirements: z
      .string()
      .max(MAX_SECTION_LENGTH, "Requirements must be at most 10,000 characters"),
    responsibilities: z
      .string()
      .max(MAX_SECTION_LENGTH, "Responsibilities must be at most 10,000 characters"),
    benefits: z.string().max(MAX_SECTION_LENGTH, "Benefits must be at most 10,000 characters"),
    categoryId: z.uuid({ error: "Select a job category" }),
    typeId: z.uuid({ error: "Select a job type" }),
    locationId: z.uuid({ error: "Select a location" }),
    companyId: z.uuid({ error: "Select a company" }),
    status: z.enum(JOB_STATUSES, { error: "Select a status" }),
    employmentType: z.enum(EMPLOYMENT_TYPES, { error: "Select an employment type" }),
    experienceLevel: z.enum(EXPERIENCE_LEVELS, { error: "Select an experience level" }),
    salaryMin: salaryString,
    salaryMax: salaryString,
    currency: z.string().length(3, "Currency must be a 3-letter ISO code"),
    isRemote: z.boolean(),
    isFeatured: z.boolean(),
    applicationDeadline: z
      .string()
      .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date"),
    tags: z.string().superRefine((value, ctx) => {
      const tags = value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tags.length > MAX_TAGS) {
        ctx.addIssue({ code: "custom", message: `Use at most ${MAX_TAGS} tags` });
      }
      if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
        ctx.addIssue({
          code: "custom",
          message: `Each tag must be at most ${MAX_TAG_LENGTH} characters`,
        });
      }
    }),
  })
  .refine(
    (data) => {
      const min = data.salaryMin === "" ? undefined : Number(data.salaryMin);
      const max = data.salaryMax === "" ? undefined : Number(data.salaryMax);
      return min === undefined || max === undefined || max >= min;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    },
  );

// Type for the validated job posting form values
export type JobPostingFormValues = z.infer<typeof jobPostingSchema>;
