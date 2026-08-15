"use client";

import { TextareaField, TextField, SelectField } from "@/components/dashboard/form-sheet";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ANNOUNCEMENT_TYPE_DISPLAY, ANNOUNCEMENT_TYPES } from "@/types/announcement";

import { TYPE_ICON_MAP } from "./icon-maps";
import type { ContentSectionProps } from "./types";

/**
 * Core announcement content. The type select keeps its rich option labels
 * (icon + name) via direct FormField composition; the author select is
 * data-driven so it uses the SelectField shorthand.
 */
export function ContentSection({ form, authors }: ContentSectionProps) {
  return (
    <div className="space-y-4">
      <TextField
        name="title"
        label="Title"
        required
        placeholder="Enter announcement title"
        autoComplete="off"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Type<span aria-hidden="true"> *</span>
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-required="true">
                    <SelectValue placeholder="Select announcement type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ANNOUNCEMENT_TYPES.map((type) => {
                    const IconComponent = TYPE_ICON_MAP[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {IconComponent ? <IconComponent className="h-4 w-4" /> : null}
                          <span>{ANNOUNCEMENT_TYPE_DISPLAY[type].name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <SelectField
          name="authorId"
          label="Author"
          required
          placeholder="Select author"
          options={authors.map((author) => ({ value: author.id, label: author.name }))}
        />
      </div>

      <TextareaField
        name="excerpt"
        label="Excerpt"
        required
        placeholder="Brief summary of the announcement"
        rows={3}
      />

      <TextareaField
        name="content"
        label="Content"
        required
        placeholder="Full announcement content"
        rows={8}
      />
    </div>
  );
}
