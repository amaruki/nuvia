import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_TYPES,
  CATEGORY_STATUSES,
  CATEGORY_TYPE_DISPLAY,
  CATEGORY_STATUS_DISPLAY,
} from "@/types/category.types";
import type { CategoryType, CategoryStatus } from "@/types/category.types";

import type { TypeStatusSectionProps } from "./types";

export function TypeStatusSection({ form, watchedType }: TypeStatusSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select
          value={watchedType}
          onValueChange={(value) => form.setValue("type", value as CategoryType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category type" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: CATEGORY_TYPE_DISPLAY[type].color }}
                  />
                  {CATEGORY_TYPE_DISPLAY[type].name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.type && (
          <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select
          value={form.watch("status")}
          onValueChange={(value) => form.setValue("status", value as CategoryStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <Badge variant={CATEGORY_STATUS_DISPLAY[status].badgeVariant} className="text-xs">
                    {CATEGORY_STATUS_DISPLAY[status].name}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.status && (
          <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
        )}
      </div>
    </div>
  );
}
