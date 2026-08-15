import type { UseFormReturn } from "react-hook-form";

import type { ChapterFormValues } from "@/lib/validation/organization.validation";

export type ChapterForm = UseFormReturn<ChapterFormValues>;

export interface ChapterFormSectionProps {
  form: ChapterForm;
}
