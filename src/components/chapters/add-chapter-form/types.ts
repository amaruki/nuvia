import { UseFormReturn } from "react-hook-form";
import { ChapterFormData } from "@/types/chapter.types";
import { ChapterFormValues } from "./schema";

export interface AddChapterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChapterFormData) => Promise<void>;
  initialData?: ChapterFormData;
  isEditing?: boolean;
}

export type ChapterForm = UseFormReturn<ChapterFormValues>;
