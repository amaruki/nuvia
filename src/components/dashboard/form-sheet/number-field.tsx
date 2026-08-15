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

export interface NumberFieldProps {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  disabled?: boolean;
  /** Extra classes for the Input control itself. */
  className?: string;
}

/**
 * Standard numeric field. Browsers report input values as strings, so this
 * shorthand converts to a number on the way into the form state and keeps
 * zod `z.number()` schemas honest without per-form coercion hacks. Empty
 * input stays empty so required validation fires. Must be rendered inside
 * a Form (react-hook-form FormProvider).
 */
export function NumberField({
  name,
  label,
  description,
  placeholder,
  required,
  min,
  max,
  step,
  disabled,
  className,
}: NumberFieldProps) {
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
              type="number"
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required || undefined}
              className={className}
              value={field.value ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                field.onChange(raw === "" ? "" : Number(raw));
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
