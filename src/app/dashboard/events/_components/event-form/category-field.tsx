"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logger } from "@/lib/logger";
import { createEventCategory, getEventCategories } from "@/lib/services/event";
import type { ApiEventCategory } from "@/lib/services/event/types";
import type { EventFormValues } from "@/lib/validation/event.validation";

/**
 * Category select with a fresh-install escape hatch: the events table
 * requires a category, so when none exists yet an inline affordance
 * creates the first one without leaving the sheet. Composed from the
 * ui/form primitives because no field shorthand covers the
 * loading/error/empty states.
 */
export function CategoryField() {
  const { control, setValue } = useFormContext<EventFormValues>();
  const [categories, setCategories] = useState<ApiEventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getEventCategories();
      setCategories(list);
    } catch (error) {
      logger.error("Error loading event categories", error);
      setLoadError("Could not load event categories. Try reloading the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || isAddingCategory) return;
    setIsAddingCategory(true);
    try {
      const created = await createEventCategory({ name, displayName: name });
      setNewCategoryName("");
      await loadCategories();
      setValue("category", created.name, { shouldDirty: true });
      toast.success(`Category "${created.displayName}" created`);
    } catch (error) {
      logger.error("Error creating event category", error);
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <FormField
      control={control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Category
            <span aria-hidden="true"> *</span>
          </FormLabel>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading categories…
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : categories.length === 0 ? (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <p className="text-sm text-muted-foreground">
                No event categories exist yet. A category is required to create an event; add the
                first one below.
              </p>
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Category name, e.g. General"
                  aria-label="New category name"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCategory}
                  disabled={isAddingCategory || !newCategoryName.trim()}
                >
                  {isAddingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Add category
                </Button>
              </div>
            </div>
          ) : (
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-required="true">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.displayName ?? category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
