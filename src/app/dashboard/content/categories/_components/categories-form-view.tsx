import { Button } from "@/components/ui/button";

import { AddCategoryForm } from "@/components/content/add-category-form";
import type { Category, CategoryFormData } from "@/types/category.types";

interface CategoriesFormViewProps {
  editingCategory: Category | null;
  isLoading: boolean;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
}

export function CategoriesFormView({
  editingCategory,
  isLoading,
  onSubmit,
  onCancel,
}: CategoriesFormViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {editingCategory ? "Edit Category" : "Create New Category"}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <AddCategoryForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        editingCategory={editingCategory || undefined}
        isLoading={isLoading}
      />
    </div>
  );
}
