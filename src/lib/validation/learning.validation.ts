/**
 * Validation schemas for the learning domain: the instructor settings form
 * and the admin course create/edit form.
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

// ---------------------------------------------------------------------------
// Admin course form (URL-driven create/edit sheet on the learning admin page)
// ---------------------------------------------------------------------------

export const courseLessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Lesson title is required"),
  duration: z.string().min(1, "Duration is required"),
  type: z.enum(["video", "article", "quiz"]),
  isCompleted: z.boolean().optional(),
});

export const courseModuleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title is required"),
  lessons: z.array(courseLessonSchema),
});

export const courseFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  image: z
    .string()
    .url({
      message: "Please look for a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  modules: z.array(courseModuleSchema).optional(),
});

export type CourseFormValues = z.output<typeof courseFormSchema>;
export type CourseFormInput = z.input<typeof courseFormSchema>;
export type CourseLessonType = z.infer<typeof courseLessonSchema>["type"];
