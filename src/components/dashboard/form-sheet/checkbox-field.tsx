"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface CheckboxFieldProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Standard boolean toggle rendered as a checkbox with its label beside it.
 * Radix reports "indeterminate" as a third state; form schemas model plain
 * booleans, so only a true check flips the value. Must be rendered inside
 * a Form (react-hook-form FormProvider).
 */
export function CheckboxField({ name, label, description, disabled }: CheckboxFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value === true}
              disabled={disabled}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
