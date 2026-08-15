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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  name: string;
  label: string;
  options: SelectFieldOption[];
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Standard single-select field backed by the shadcn Select. Options are
 * data, not JSX, so lists stay declarative. Must be rendered inside a Form
 * (react-hook-form FormProvider).
 */
export function SelectField({
  name,
  label,
  options,
  description,
  placeholder = "Select...",
  required,
  disabled,
}: SelectFieldProps) {
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
          <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger aria-required={required || undefined}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
