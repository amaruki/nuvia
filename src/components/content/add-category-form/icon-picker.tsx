import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { CATEGORY_ICON_OPTIONS, findCategoryIcon } from "./icon-options";
import type { CategoryForm } from "./types";

interface CategoryIconPickerProps {
  form: CategoryForm;
}

/**
 * Searchable lucide icon picker for the category `icon` field (UI-13).
 * The curated grid writes canonical icon names; the text input stays so
 * names outside the curated set (existing stored data) remain editable.
 */
export function CategoryIconPicker({ form }: CategoryIconPickerProps) {
  const [query, setQuery] = useState("");
  const selected = form.watch("icon") ?? "";
  const selectedNormalized = selected.trim().toLowerCase();

  const options = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return CATEGORY_ICON_OPTIONS;
    return CATEGORY_ICON_OPTIONS.filter((option) => option.name.toLowerCase().includes(normalized));
  }, [query]);

  const hasCustomSelection = Boolean(selected.trim()) && !findCategoryIcon(selected);

  return (
    <div className="space-y-2">
      <Label htmlFor="icon-search">Icon</Label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="icon-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search icons"
          className="pl-9"
        />
      </div>
      <div
        role="group"
        aria-label="Category icon options"
        className="grid grid-cols-6 gap-1 rounded-md border bg-background p-2 sm:grid-cols-8"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const pressed = option.name.toLowerCase() === selectedNormalized;
          return (
            <button
              key={option.name}
              type="button"
              aria-pressed={pressed}
              aria-label={option.name}
              title={option.name}
              onClick={() => form.setValue("icon", option.name, { shouldDirty: true })}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                pressed && "bg-primary/10 text-primary ring-1 ring-primary",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          );
        })}
        {options.length === 0 && (
          <p className="col-span-full py-2 text-center text-xs text-muted-foreground">
            No icons match. Try another search or type a name below.
          </p>
        )}
      </div>
      <Input
        id="icon"
        {...form.register("icon")}
        placeholder="Folder"
        aria-describedby="icon-help"
        className={cn(form.formState.errors.icon && "border-destructive")}
      />
      <p id="icon-help" className="text-xs text-muted-foreground">
        Pick an icon above or type a Lucide icon name (Folder, BookOpen, Calendar).
        {hasCustomSelection && ` Current value "${selected.trim()}" is outside the curated set.`}
      </p>
      {form.formState.errors.icon && (
        <p className="text-sm text-destructive">{form.formState.errors.icon.message}</p>
      )}
    </div>
  );
}
