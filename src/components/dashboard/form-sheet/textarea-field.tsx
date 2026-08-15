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
import { Textarea } from "@/components/ui/textarea";

export interface TextareaFieldProps {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
  /** Extra classes for the Textarea control itself. */
  className?: string;
}

/**
 * Standard multi-line text field. Same contract as TextField; must be
 * rendered inside a Form (react-hook-form FormProvider).
 */
export function TextareaField({
  name,
  label,
  description,
  placeholder,
  required,
  rows = 3,
  disabled,
  className,
}: TextareaFieldProps) {
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
            <Textarea
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required || undefined}
              className={className}
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
