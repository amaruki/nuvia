import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { CategoryFormSectionProps } from "./types";

export function BasicInfoSection({ form }: CategoryFormSectionProps) {
  return (
    <>
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
    </>
  );
}
