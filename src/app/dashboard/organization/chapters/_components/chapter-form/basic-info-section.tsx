import { TextareaField, TextField } from "@/components/dashboard/form-sheet";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { statusOptions } from "./options";
import type { ChapterFormSectionProps } from "./types";

/**
 * The status select keeps its two-line option labels (name plus
 * description), which is why it composes FormField directly instead of the
 * SelectField shorthand.
 */
export function BasicInfoSection({ form }: ChapterFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="name"
          label="Chapter name"
          required
          placeholder="e.g., new_york_chapter"
          autoComplete="off"
        />
        <TextField
          name="displayName"
          label="Display name"
          required
          placeholder="e.g., New York Chapter"
          autoComplete="off"
        />
      </div>

      <TextareaField
        name="description"
        label="Description"
        placeholder="Brief description of the chapter's purpose and focus..."
        rows={3}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Status<span aria-hidden="true"> *</span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground text-sm">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
