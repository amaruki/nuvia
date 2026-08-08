import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CATEGORY_SCOPES, CATEGORY_SCOPE_DISPLAY } from "@/types/category.types";
import type { CategoryScope } from "@/types/category.types";

import type { ScopeOrderSectionProps } from "./types";

export function ScopeOrderSection({ form, watchedScope }: ScopeOrderSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="scope">Scope *</Label>
        <Select
          value={watchedScope}
          onValueChange={(value) => form.setValue("scope", value as CategoryScope)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select scope" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_SCOPES.map((scope) => (
              <SelectItem key={scope} value={scope}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: CATEGORY_SCOPE_DISPLAY[scope].color }}
                  />
                  {CATEGORY_SCOPE_DISPLAY[scope].name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.scope && (
          <p className="text-sm text-red-500">{form.formState.errors.scope.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Display Order</Label>
        <Input
          id="order"
          type="number"
          {...form.register("order", { valueAsNumber: true })}
          placeholder="0"
          className={cn(form.formState.errors.order && "border-red-500")}
        />
        {form.formState.errors.order && (
          <p className="text-sm text-red-500">{form.formState.errors.order.message}</p>
        )}
      </div>
    </div>
  );
}
