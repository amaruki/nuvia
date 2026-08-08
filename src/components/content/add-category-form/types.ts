import type { UseFormReturn } from "react-hook-form";

import type {
  Category,
  CategoryFormData,
  CategoryScope,
  CategoryType,
} from "@/types/category.types";

export interface AddCategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  editingCategory?: Category;
  isLoading?: boolean;
}

export type CategoryForm = UseFormReturn<CategoryFormData>;

export interface CategoryFormSectionProps {
  form: CategoryForm;
}

export interface TypeStatusSectionProps extends CategoryFormSectionProps {
  watchedType: CategoryType;
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

export interface AccessControlSectionProps extends CategoryFormSectionProps {
  watchedScope: CategoryScope;
}
