import type { UseFormReturn } from "react-hook-form";

import type { CategoryFormData, CategoryScope } from "@/types/category.types";

export type CategoryForm = UseFormReturn<CategoryFormData>;

export interface CategoryFormSectionProps {
  form: CategoryForm;
}

export interface ScopeOrderSectionProps extends CategoryFormSectionProps {
  watchedScope: CategoryScope;
}

export interface VisualSettingsSectionProps extends CategoryFormSectionProps {
  selectedColor: string;
  useEmoji: boolean;
  onColorSelect: (color: string) => void;
  onToggleEmojiMode: () => void;
}

export interface AccessControlSectionProps {
  watchedScope: CategoryScope;
}
