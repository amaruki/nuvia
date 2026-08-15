import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_STATUS_DISPLAY,
  CATEGORY_STATUSES,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_TYPES,
} from "@/types/category.types";
import { Badge } from "@/components/ui/badge";

import type { CategoryFormSectionProps } from "./types";

/**
 * Type and status selects keep rich option labels (color swatch, status
 * badge), which is why they compose FormField directly instead of using
 * the SelectField shorthand.
 */
export function TypeStatusSection({ form }: CategoryFormSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CATEGORY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-3 rounded"
                        style={{ backgroundColor: CATEGORY_TYPE_DISPLAY[type].color }}
                      />
                      {CATEGORY_TYPE_DISPLAY[type].name}
                    </span>
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
                {CATEGORY_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    <Badge
                      variant={CATEGORY_STATUS_DISPLAY[status].badgeVariant}
                      className="text-xs"
                    >
                      {CATEGORY_STATUS_DISPLAY[status].name}
                    </Badge>
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
