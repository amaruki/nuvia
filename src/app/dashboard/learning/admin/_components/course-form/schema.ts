import * as z from "zod";

export const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Lesson title is required"),
  duration: z.string().min(1, "Duration is required"),
  type: z.enum(["video", "article", "quiz"]),
  isCompleted: z.boolean().optional(),
});

export const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title is required"),
  lessons: z.array(lessonSchema),
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
  modules: z.array(moduleSchema).optional(),
});

export type CourseFormValues = z.output<typeof courseFormSchema>;
export type CourseFormInput = z.input<typeof courseFormSchema>;
export type LessonType = z.infer<typeof lessonSchema>["type"];
export type CourseLevel = CourseFormValues["level"];
