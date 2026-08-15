import { NumberField } from "@/components/dashboard/form-sheet";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_SCOPE_DISPLAY, CATEGORY_SCOPES } from "@/types/category.types";

import type { ScopeOrderSectionProps } from "./types";

/**
 * Scope keeps a rich option label (color swatch) via direct FormField
 * composition; display order uses the standard NumberField shorthand.
 */
export function ScopeOrderSection({ form, watchedScope }: ScopeOrderSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="scope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Scope<span aria-hidden="true"> *</span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger aria-required="true">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CATEGORY_SCOPES.map((scope) => (
                  <SelectItem key={scope} value={scope}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-3 rounded"
                        style={{ backgroundColor: CATEGORY_SCOPE_DISPLAY[scope].color }}
                      />
                      {CATEGORY_SCOPE_DISPLAY[scope].name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <NumberField
          name="order"
          label="Display order"
          placeholder="0"
          min={0}
          description={
            watchedScope === "global" ? undefined : "Lower numbers appear first within the scope."
          }
        />
      </div>
    </div>
  );
}
