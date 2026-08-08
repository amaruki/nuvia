import { TabsContent } from "@/components/ui/tabs";
import { Folder } from "lucide-react";

import { CategoryCard } from "@/components/content/category-card";
import type { Category, CategoryStatus } from "@/types/category.types";

interface CategoriesListTabProps {
  categories: Category[];
  selectedIds: string[];
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onDuplicate: (category: Category) => void;
  onStatusChange: (category: Category, status: CategoryStatus) => void;
  onToggleSelect: (category: Category, selected: boolean) => void;
}

export function CategoriesListTab({
  categories,
  selectedIds,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  onToggleSelect,
}: CategoriesListTabProps) {
  return (
    <TabsContent value="categories" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onStatusChange={onStatusChange}
            selected={selectedIds.includes(category.id)}
            onSelect={onToggleSelect}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-sm">
            Try adjusting your filters or create a new category to get started.
          </p>
        </div>
      )}
    </TabsContent>
  );
}
