"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  FormActions,
  FormSection,
  FormSheet,
  SelectField,
  TextField,
  TextareaField,
  NumberField,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import type { BudgetCategoryInput } from "@/lib/hooks/use-finance-budgets/types";
import {
  budgetCategoryFormSchema,
  type BudgetCategoryFormInput,
  type BudgetCategoryFormValues,
} from "@/lib/validation/budget.validation";

const FORM_ID = "budget-category-form";

/** Reuses the palette the legacy budget dialog offered. */
const CATEGORY_COLORS = [
  { label: "Primary", value: "var(--primary)" },
  { label: "Secondary", value: "var(--secondary)" },
  { label: "Destructive", value: "var(--destructive)" },
  { label: "Muted", value: "var(--muted)" },
  { label: "Accent", value: "var(--accent)" },
  { label: "Chart 1", value: "var(--chart-1)" },
  { label: "Chart 2", value: "var(--chart-2)" },
  { label: "Chart 3", value: "var(--chart-3)" },
  { label: "Chart 4", value: "var(--chart-4)" },
  { label: "Chart 5", value: "var(--chart-5)" },
];

const EMPTY_VALUES: BudgetCategoryFormValues = {
  name: "",
  description: "",
  color: CATEGORY_COLORS[0].value,
  allocatedAmount: 0,
};

export interface BudgetCategorySheetProps {
  sheet: FormSheetState;
  onCreate: (input: BudgetCategoryInput) => Promise<unknown>;
}

/**
 * Create-only sheet for budget categories (CODING_STANDARD "Dashboard
 * forms"), opened by ?form=new. Categories have no update endpoint, so the
 * sheet never opens in edit mode.
 */
export function BudgetCategorySheet({ sheet, onCreate }: BudgetCategorySheetProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<BudgetCategoryFormInput, unknown, BudgetCategoryFormValues>({
    resolver: zodResolver(budgetCategoryFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Re-seed on every open so a cancelled draft never leaks into the next one.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    form.reset(EMPTY_VALUES);
    setSubmitError(null);
  }, [sheet.mode, form]);

  const onSubmit = async (values: BudgetCategoryFormValues) => {
    setSubmitError(null);
    try {
      await onCreate({
        name: values.name,
        description: values.description || undefined,
        color: values.color,
        allocatedAmount: values.allocatedAmount.toFixed(2),
      });
      toast.success("Category created");
      sheet.close();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create the category.");
    }
  };

  const { isDirty, isSubmitting } = form.formState;

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title="New budget category"
      description="Categories group spending and carry an annual allocation."
      isDirty={isDirty && !isSubmitting}
      footer={
        <FormActions
          formId={FORM_ID}
          mode="create"
          submitting={isSubmitting}
          onCancel={sheet.close}
          entityLabel="Category"
        />
      }
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="space-y-6 p-6"
        >
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <FormSection title="Category">
            <TextField name="name" label="Name" placeholder="Events" required autoComplete="off" />
            <TextareaField
              name="description"
              label="Description"
              placeholder="What this category covers"
            />
            <SelectField
              name="color"
              label="Color"
              options={CATEGORY_COLORS}
              description="Used for the category badge."
              required
            />
            <NumberField
              name="allocatedAmount"
              label="Allocated amount"
              description="The budget available for this category."
              placeholder="0.00"
              min={0}
              step="any"
              required
            />
          </FormSection>
        </form>
      </Form>
    </FormSheet>
  );
}

export default BudgetCategorySheet;
