import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { AccessControlSectionProps } from "./types";

export function AccessControlSection({ form, watchedScope }: AccessControlSectionProps) {
  if (watchedScope === "global") {
    return null;
  }

  return (
    <div className="space-y-4">
      <Label>Access Control</Label>

      {watchedScope === "chapter" && (
        <div className="space-y-2">
          <Label>Allowed Chapters</Label>
          <Input
            {...form.register("allowedChapters")}
            placeholder="Comma-separated chapter IDs"
            className={cn(form.formState.errors.allowedChapters && "border-red-500")}
          />
          {form.formState.errors.allowedChapters && (
            <p className="text-sm text-red-500">{form.formState.errors.allowedChapters.message}</p>
          )}
        </div>
      )}

      {watchedScope === "committee" && (
        <div className="space-y-2">
          <Label>Allowed Committees</Label>
          <Input
            {...form.register("allowedCommittees")}
            placeholder="Comma-separated committee IDs"
            className={cn(form.formState.errors.allowedCommittees && "border-red-500")}
          />
          {form.formState.errors.allowedCommittees && (
            <p className="text-sm text-red-500">
              {form.formState.errors.allowedCommittees.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
