import { TextareaField, TextField } from "@/components/dashboard/form-sheet";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { statusOptions, typeOptions } from "./options";
import type { CommitteeFormSectionProps } from "./types";

/**
 * Status and type keep their two-line option labels (name plus description),
 * which is why they compose FormField directly instead of the SelectField
 * shorthand.
 */
export function BasicInfoSection({ form }: CommitteeFormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          name="name"
          label="Committee name"
          required
          placeholder="e.g., finance_committee"
          autoComplete="off"
        />
        <TextField
          name="displayName"
          label="Display name"
          required
          placeholder="e.g., Finance Committee"
          autoComplete="off"
        />
      </div>

      <TextareaField
        name="description"
        label="Description"
        placeholder="Brief description of the committee's role and focus..."
        rows={3}
      />

      <TextareaField
        name="purpose"
        label="Purpose"
        required
        placeholder="Clear statement of the committee's purpose and objectives..."
        rows={3}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
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

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Committee type</FormLabel>
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
    </div>
  );
}
