import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Layers, Plus } from "lucide-react";

import { CreateCategoryDialog } from "./create-category-dialog";
import type { CategoryFormData } from "./types";

interface CategoryEmptyStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CategoryFormData;
  onFormDataChange: (data: CategoryFormData) => void;
  onCreate: () => void;
}

export function CategoryEmptyState({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onCreate,
}: CategoryEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
            <Layers className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No categories found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Create your first discussion category to start organizing your community forums.
          </p>
          <CreateCategoryDialog
            open={open}
            onOpenChange={onOpenChange}
            formData={formData}
            onFormDataChange={onFormDataChange}
            onCreate={onCreate}
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Category
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
