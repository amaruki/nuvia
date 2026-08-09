"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Plus } from "lucide-react";

import {
  useCreateForumCategory,
  useDeleteForumCategory,
  useForumCategories,
  useUpdateForumCategory,
} from "@/lib/hooks/use-forums";
import { logger } from "@/lib/logger";
import type { ForumCategory } from "@/types/forum.types";

import { ForumLayout } from "../forum-layout";
import { CategoryCard } from "./category-card";
import { CategoryEmptyState } from "./category-empty-state";
import { CategorySkeleton } from "./category-skeleton";
import { CreateCategoryDialog } from "./create-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import type { CategoryFormData } from "./types";

export function CategoryManager() {
  const { data: categories = [], isLoading } = useForumCategories();
  const createCategory = useCreateForumCategory();
  const updateCategory = useUpdateForumCategory();
  const deleteCategory = useDeleteForumCategory();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ForumCategory | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states — "name" maps to the category's display name; the API
  // derives the unique slug from it.
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", description: "" });

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDeleteCategory = () => {
    if (!deleteTargetId) return;
    deleteCategory.mutate(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
      onError: (error) => logger.error("Failed to delete category", error),
    });
  };

  const handleEdit = (category: ForumCategory) => {
    setCurrentCategory(category);
    setFormData({ name: category.name, description: category.description });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!currentCategory) return;
    updateCategory.mutate(
      {
        id: currentCategory.id,
        input: { name: formData.name, description: formData.description },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setCurrentCategory(null);
        },
        onError: (error) => logger.error("Failed to update category", error),
      },
    );
  };

  const handleCreate = () => {
    createCategory.mutate(
      { name: formData.name, description: formData.description },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData({ name: "", description: "" });
        },
        onError: (error) => logger.error("Failed to create category", error),
      },
    );
  };

  return (
    <ForumLayout
      title="Forum Categories"
      description="Manage the structure of your community discussions."
      total={categories.length}
      actions={
        <CreateCategoryDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          formData={formData}
          onFormDataChange={setFormData}
          onCreate={handleCreate}
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          }
        />
      }
    >
      {isLoading ? (
        <CategorySkeleton />
      ) : categories.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <CategoryEmptyState
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          formData={formData}
          onFormDataChange={setFormData}
          onCreate={handleCreate}
        />
      )}

      <EditCategoryDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleUpdate}
      />

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open && !deleteCategory.isPending) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteCategory.isPending || !deleteTargetId}
              onClick={confirmDeleteCategory}
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete category"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ForumLayout>
  );
}
