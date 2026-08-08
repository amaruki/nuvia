import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { PublicationFormData } from "@/types/publication.types";
import { publicationFormSchema } from "./schema";

export interface PublicationPageFormProps {
  onSubmit: (data: PublicationFormData) => void;
  initialData?: Partial<PublicationFormData>;
  isEditing?: boolean;
}

export type PublicationForm = UseFormReturn<
  z.input<typeof publicationFormSchema>,
  unknown,
  PublicationFormData
>;
