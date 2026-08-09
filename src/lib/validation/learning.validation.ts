/**
 * Validation schemas for the learning/instructor settings forms.
 *
 * learningSettingsSchema backs the Public Profile form on the instructor
 * settings page. The save handler there is still the mock toast it has
 * always been — no settings endpoint exists yet — so these limits are the
 * client-side contract the form enforces today. Keep them in sync with the
 * server schema when a real endpoint lands.
 */

import { z } from "zod";

export const learningSettingsSchema = z.object({
  title: z.string().trim().max(200, "Professional title must be at most 200 characters"),

  bio: z.string().trim().max(2000, "Bio must be at most 2000 characters"),
});

export type LearningSettingsFormValues = z.infer<typeof learningSettingsSchema>;

export type LearningSettingsFormInput = z.input<typeof learningSettingsSchema>;
