/**
 * Job application validation schemas using Zod
 */

import { z } from "zod";

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
