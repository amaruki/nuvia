import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";

import type {
  PublicationFormInput,
  PublicationFormValues,
} from "@/lib/validation/content.validation";
import type { PublicationAuthor } from "@/types/publication";

export type PublicationForm = UseFormReturn<PublicationFormInput, unknown, PublicationFormValues>;

export interface PublicationFormSectionProps {
  form: PublicationForm;
}

export interface BasicInfoSectionProps {
  authors: PublicationAuthor[];
}

export interface ContentSectionProps extends PublicationFormSectionProps {
  watchContent: string;
}

export interface MediaSectionProps {
  featuredImage: string;
  setFeaturedImage: Dispatch<SetStateAction<string>>;
  handleImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}
