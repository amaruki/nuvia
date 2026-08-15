"use client";

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface DateFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
}

/**
 * Standard calendar date field (native date input, YYYY-MM-DD values).
 * Datetime ranges or pickers with timezones are custom compositions and
 * should use the FormField primitives directly. Must be rendered inside a
 * Form (react-hook-form FormProvider).
 */
export function DateField({
  name,
  label,
  description,
  required,
  min,
  max,
  disabled,
}: DateFieldProps) {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </FormLabel>
          <FormControl>
            <Input
              type="date"
              min={min}
              max={max}
              disabled={disabled}
              aria-required={required || undefined}
              {...field}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
