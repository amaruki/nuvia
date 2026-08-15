"use client";

import { useFormContext } from "react-hook-form";

import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { EventFormValues } from "@/lib/validation/event.validation";

import { TagInput } from "./tag-input";

/** Tag chips bound to the form's tags array via the shared tag-input widget. */
export function TagsSection() {
  const { control } = useFormContext<EventFormValues>();

  return (
    <FormField
      control={control}
      name="tags"
      render={({ field }) => (
        <FormItem>
          {/* FormControl is absent (composite widget), so point the label at the input by hand. */}
          <FormLabel htmlFor="tags">Add Tags</FormLabel>
          <TagInput id="tags" tags={field.value} onChange={field.onChange} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
