import type { UseFormReturn } from "react-hook-form";

import type { Course } from "@/types/learning.types";

import type { CourseFormInput, CourseFormValues } from "./schema";

export interface CourseFormProps {
  initialData?: Course | null;
}

export type CourseFormInstance = UseFormReturn<CourseFormInput, unknown, CourseFormValues>;
