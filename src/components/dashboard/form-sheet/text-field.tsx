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

export interface TextFieldProps {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "url" | "tel" | "password";
  autoComplete?: string;
  disabled?: boolean;
  /** Extra classes for the Input control itself. */
  className?: string;
}

/**
 * Standard single-line text field: label, control, optional help text, and
 * schema-driven error message wired through the shadcn form primitives.
 * Must be rendered inside a Form (react-hook-form FormProvider).
 */
export function TextField({
  name,
  label,
  description,
  placeholder,
  required,
  type = "text",
  autoComplete,
  disabled,
  className,
}: TextFieldProps) {
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
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
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
