import { useFormContext } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { AccessControlSectionProps } from "./types";

/**
 * The API stores access lists as string arrays while the input is a
 * comma-separated text field, so the value round-trips through join/split
 * here instead of binding the array directly.
 */
function ListInput({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              value={(field.value ?? []).join(", ")}
              onChange={(event) =>
                field.onChange(
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              placeholder="Comma-separated IDs"
              autoComplete="off"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function AccessControlSection({ watchedScope }: AccessControlSectionProps) {
  if (watchedScope === "global") {
    return null;
  }

  return (
    <div className="space-y-4">
      {watchedScope === "chapter" && <ListInput name="allowedChapters" label="Allowed chapters" />}
      {watchedScope === "committee" && (
        <ListInput name="allowedCommittees" label="Allowed committees" />
      )}
    </div>
  );
}
