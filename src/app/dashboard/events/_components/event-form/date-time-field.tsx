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

export interface DateTimeFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Standard `datetime-local` field for the event form. The form-kit
 * DateField shorthand covers calendar dates only, so datetime pickers
 * compose the ui/form primitives directly. Must be rendered inside a Form
 * (react-hook-form FormProvider).
 */
export function DateTimeField({
  name,
  label,
  description,
  required,
  disabled,
}: DateTimeFieldProps) {
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
              type="datetime-local"
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
