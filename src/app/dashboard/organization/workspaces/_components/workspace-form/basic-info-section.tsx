import { TextareaField, TextField } from "@/components/dashboard/form-sheet";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { typeOptions } from "./options";
import type { WorkspaceFormSectionProps } from "./types";

/**
 * The type select keeps its two-line option labels (name plus description),
 * which is why it composes FormField directly instead of the SelectField
 * shorthand.
 */
export function BasicInfoSection({ form }: WorkspaceFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="name"
          label="Workspace name"
          required
          placeholder="e.g., Executive Committee Workspace"
          autoComplete="off"
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map((option) => (
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

      <TextareaField
        name="description"
        label="Description"
        placeholder="Brief description of the workspace purpose and use case..."
        rows={3}
      />
    </div>
  );
}
