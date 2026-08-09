import { z } from "zod";

// ---------------------------------------------------------------------------
// Validation schemas (mirror the admin course form; the API accepts a small
// superset — rating/students/instructor/reviews — for programmatic callers)
// ---------------------------------------------------------------------------

const lessonSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  duration: z.string().min(1).max(50),
  type: z.enum(["video", "article", "quiz"]),
  isCompleted: z.boolean().optional(),
});

export const moduleSchema = z.object({
  id: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  lessons: z.array(lessonSchema).max(200),
});

export const reviewSchema = z.object({
  id: z.string().max(100).optional(),
  user: z.object({
    name: z.string().min(1).max(120),
    avatar: z.string().max(2048).optional(),
  }),
  rating: z.number().min(0).max(5),
  date: z.string().max(100),
  comment: z.string().max(4000),
});

const instructorSchema = z.object({
  name: z.string().min(1).max(120),
  role: z.string().max(120).optional(),
  bio: z.string().max(4000).optional(),
  avatar: z.union([z.string().url().max(2048), z.literal("")]).optional(),
  signature: z.union([z.string().url().max(2048), z.literal("")]).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  longDescription: z.string().max(8000).optional(),
  category: z.string().min(1).max(100),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().max(50).optional(),
  students: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  price: z.number().min(0).optional(),
  image: z.union([z.string().url().max(2048), z.literal("")]).optional(),
  color: z.string().max(200).optional(),
  instructor: instructorSchema.optional(),
  modules: z.array(moduleSchema).max(50).optional(),
  reviews: z.array(reviewSchema).max(100).optional(),
  features: z.array(z.string().max(300)).max(30).optional(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one course field must be provided",
  });
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const issueCertificateSchema = z.object({
  courseId: z.string().uuid(),
  studentName: z.string().min(1).max(120),
  studentEmail: z.string().email().max(320),
  grade: z.string().max(20).optional(),
  expiryDate: z.string().datetime().optional(),
});
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;

export const updateCertificateSchema = z
  .object({
    status: z.enum(["active", "revoked"]),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one certificate field must be provided",
  });
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;

export const createEnrollmentSchema = z.object({
  courseId: z.string().uuid(),
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
});
export type UpdateEnrollmentProgressInput = z.infer<typeof updateEnrollmentProgressSchema>;
