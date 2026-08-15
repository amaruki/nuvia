import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { ArticleFormInput, ArticleFormValues } from "@/lib/validation/content.validation";
import type { ArticleAuthor } from "@/types/article";

export type ArticleForm = UseFormReturn<ArticleFormInput, unknown, ArticleFormValues>;

export interface ArticleFormSectionProps {
  form: ArticleForm;
}

export interface BasicInfoSectionProps {
  authors: ArticleAuthor[];
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
