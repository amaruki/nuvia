import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import type { ArticleAuthor, ArticleFormData } from "@/types/article";
import { formSchema } from "./schema";

export interface ArticlePageFormProps {
  onSubmit: (data: ArticleFormData) => void;
  initialData?: Partial<ArticleFormData>;
  isEditing?: boolean;
}

export type ArticleForm = UseFormReturn<z.input<typeof formSchema>, unknown, ArticleFormData>;

export interface ArticleFormSectionProps {
  form: ArticleForm;
}

export interface BasicInfoSectionProps extends ArticleFormSectionProps {
  authors: ArticleAuthor[];
  watchTitle: string;
  generateSlug: (title: string) => string;
}

export interface ContentSectionProps extends ArticleFormSectionProps {
  watchContent: string;
}

export interface MediaSectionProps {
  featuredImage: string;
  setFeaturedImage: Dispatch<SetStateAction<string>>;
  gallery: string[];
  setGallery: Dispatch<SetStateAction<string[]>>;
  handleImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  handleGalleryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}
