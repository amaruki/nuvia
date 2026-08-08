"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS } from "@/types/category.types";
import type { CategoryFormData } from "@/types/category.types";

import { categoryFormSchema } from "./schema";
import type { AddCategoryFormProps } from "./types";
import { BasicInfoSection } from "./basic-info-section";
import { TypeStatusSection } from "./type-status-section";
import { ScopeOrderSection } from "./scope-order-section";
import { VisualSettingsSection } from "./visual-settings-section";
import { AccessControlSection } from "./access-control-section";

export function AddCategoryForm({
  onSubmit,
  onCancel,
  editingCategory,
  isLoading = false,
}: AddCategoryFormProps) {
  const [selectedColor, setSelectedColor] = useState(
    editingCategory?.color || CATEGORY_COLORS[0].value,
  );
  const [useEmoji, setUseEmoji] = useState(!!editingCategory?.emoji);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: editingCategory
      ? {
          name: editingCategory.name,
          slug: editingCategory.slug,
          description: editingCategory.description,
          type: editingCategory.type,
          status: editingCategory.status,
          scope: editingCategory.scope,
          color: editingCategory.color,
          icon: editingCategory.icon,
          emoji: editingCategory.emoji,
          parentId: editingCategory.parentId,
          order: editingCategory.order,
          allowedRoles: editingCategory.allowedRoles,
          allowedChapters: editingCategory.allowedChapters,
          allowedCommittees: editingCategory.allowedCommittees,
          metadata: editingCategory.metadata,
        }
      : {
          name: "",
          description: "",
          type: "article",
          status: "active",
          scope: "global",
          color: CATEGORY_COLORS[0].value,
          icon: "",
          emoji: "",
          order: 0,
          allowedRoles: [],
          allowedChapters: [],
          allowedCommittees: [],
          metadata: {},
        },
  });

  const watchedType = form.watch("type");
  const watchedScope = form.watch("scope");

  useEffect(() => {
    if (editingCategory?.color) {
      setSelectedColor(editingCategory.color);
    }
  }, [editingCategory]);

  useEffect(() => {
    form.setValue("color", selectedColor);
  }, [selectedColor, form]);

  useEffect(() => {
    setUseEmoji(!!form.watch("emoji"));
  }, [form.watch("emoji")]);

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit({
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-"),
        color: selectedColor,
      });
    } catch (error) {
      logger.error("Form submission error", error);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const toggleEmojiMode = () => {
    const newUseEmoji = !useEmoji;
    setUseEmoji(newUseEmoji);
    if (newUseEmoji) {
      form.setValue("icon", "");
      form.setValue("emoji", "📁");
    } else {
      form.setValue("emoji", "");
      form.setValue("icon", "folder");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingCategory ? "Edit Category" : "Create New Category"}</CardTitle>
          <CardDescription>
            {editingCategory
              ? "Update the category details and settings."
              : "Create a new category to organize your content."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <BasicInfoSection form={form} />

            <TypeStatusSection form={form} watchedType={watchedType} />

            <ScopeOrderSection form={form} watchedScope={watchedScope} />

            <VisualSettingsSection
              form={form}
              selectedColor={selectedColor}
              useEmoji={useEmoji}
              onColorSelect={handleColorSelect}
              onToggleEmojiMode={toggleEmojiMode}
            />

            <AccessControlSection form={form} watchedScope={watchedScope} />

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
