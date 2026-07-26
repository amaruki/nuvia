"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_TYPES,
  CATEGORY_STATUSES,
  CATEGORY_SCOPES,
  CATEGORY_COLORS,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_STATUS_DISPLAY,
  CATEGORY_SCOPE_DISPLAY,
  CategoryFormData,
  Category,
  CategoryType,
  CategoryStatus,
  CategoryScope,
} from "@/types/category.types";
import { cn } from "@/lib/utils";

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name must be less than 100 characters"),
  slug: z.string().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  type: z.enum(CATEGORY_TYPES),
  status: z.enum(CATEGORY_STATUSES),
  scope: z.enum(CATEGORY_SCOPES),
  color: z.string().min(1, "Color is required"),
  icon: z.string().optional(),
  emoji: z.string().max(2, "Emoji must be maximum 2 characters").optional(),
  parentId: z.string().optional(),
  order: z.number().min(0, "Order must be 0 or greater"),
  allowedRoles: z.array(z.string()).optional(),
  allowedChapters: z.array(z.string()).optional(),
  allowedCommittees: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

interface AddCategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  editingCategory?: Category;
  isLoading?: boolean;
}

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
      console.error("Form submission error:", error);
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
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter category name"
                  className={cn(form.formState.errors.name && "border-red-500")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...form.register("slug")}
                  placeholder="category-slug (auto-generated)"
                  className={cn(form.formState.errors.slug && "border-red-500")}
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe what this category is used for..."
                rows={3}
                className={cn(form.formState.errors.description && "border-red-500")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Type and Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={watchedType}
                  onValueChange={(value) => form.setValue("type", value as CategoryType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: CATEGORY_TYPE_DISPLAY[type].color }}
                          />
                          {CATEGORY_TYPE_DISPLAY[type].name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as CategoryStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={CATEGORY_STATUS_DISPLAY[status].badgeVariant}
                            className="text-xs"
                          >
                            {CATEGORY_STATUS_DISPLAY[status].name}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Scope and Order */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scope">Scope *</Label>
                <Select
                  value={watchedScope}
                  onValueChange={(value) => form.setValue("scope", value as CategoryScope)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_SCOPES.map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: CATEGORY_SCOPE_DISPLAY[scope].color }}
                          />
                          {CATEGORY_SCOPE_DISPLAY[scope].name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.scope && (
                  <p className="text-sm text-red-500">{form.formState.errors.scope.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  {...form.register("order", { valueAsNumber: true })}
                  placeholder="0"
                  className={cn(form.formState.errors.order && "border-red-500")}
                />
                {form.formState.errors.order && (
                  <p className="text-sm text-red-500">{form.formState.errors.order.message}</p>
                )}
              </div>
            </div>

            {/* Visual Settings */}
            <div className="space-y-4">
              <Label>Visual Appearance</Label>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorSelect(color.value)}
                      className={cn(
                        "w-8 h-8 rounded-lg border-2 transition-all",
                        selectedColor === color.value
                          ? "border-primary scale-110"
                          : "border-muted hover:border-muted-foreground",
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Icon/Emoji Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Icon Type</Label>
                  <Button type="button" variant="outline" size="sm" onClick={toggleEmojiMode}>
                    {useEmoji ? "Use Icon" : "Use Emoji"}
                  </Button>
                </div>

                {useEmoji ? (
                  <div className="space-y-2">
                    <Label htmlFor="emoji">Emoji</Label>
                    <Input
                      id="emoji"
                      {...form.register("emoji")}
                      placeholder="📁"
                      maxLength={2}
                      className={cn(form.formState.errors.emoji && "border-red-500")}
                    />
                    {form.formState.errors.emoji && (
                      <p className="text-sm text-red-500">{form.formState.errors.emoji.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon Name</Label>
                    <Input
                      id="icon"
                      {...form.register("icon")}
                      placeholder="folder"
                      className={cn(form.formState.errors.icon && "border-red-500")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use Lucide React icon names (e.g., folder, book, calendar)
                    </p>
                    {form.formState.errors.icon && (
                      <p className="text-sm text-red-500">{form.formState.errors.icon.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Access Control */}
            {watchedScope !== "global" && (
              <div className="space-y-4">
                <Label>Access Control</Label>

                {watchedScope === "chapter" && (
                  <div className="space-y-2">
                    <Label>Allowed Chapters</Label>
                    <Input
                      {...form.register("allowedChapters")}
                      placeholder="Comma-separated chapter IDs"
                      className={cn(form.formState.errors.allowedChapters && "border-red-500")}
                    />
                    {form.formState.errors.allowedChapters && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.allowedChapters.message}
                      </p>
                    )}
                  </div>
                )}

                {watchedScope === "committee" && (
                  <div className="space-y-2">
                    <Label>Allowed Committees</Label>
                    <Input
                      {...form.register("allowedCommittees")}
                      placeholder="Comma-separated committee IDs"
                      className={cn(form.formState.errors.allowedCommittees && "border-red-500")}
                    />
                    {form.formState.errors.allowedCommittees && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.allowedCommittees.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

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
