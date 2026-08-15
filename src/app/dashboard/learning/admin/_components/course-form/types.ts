import type { UseFormReturn } from "react-hook-form";

import type { CourseFormInput, CourseFormValues } from "@/lib/validation/learning.validation";

export type CourseFormInstance = UseFormReturn<CourseFormInput, unknown, CourseFormValues>;

export interface CourseFormSectionProps {
  form: CourseFormInstance;
}
