import type { UseFormReturn } from "react-hook-form";
import type * as z from "zod";

import type { AnnouncementFormData, AnnouncementFormValues } from "@/types/announcement";

import type { announcementFormSchema } from "./schema";

export interface AddAnnouncementFormProps {
  initialData?: Partial<AnnouncementFormValues>;
  onSubmit: (data: AnnouncementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export type AnnouncementFormFields = z.input<typeof announcementFormSchema>;

export type AnnouncementForm = UseFormReturn<
  z.input<typeof announcementFormSchema>,
  unknown,
  AnnouncementFormValues
>;
