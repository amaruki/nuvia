"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  FormActions,
  FormSection,
  FormSheet,
  SelectField,
  TextField,
  TextareaField,
  NumberField,
  DateField,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgetTransactionQuery } from "@/lib/hooks/use-finance-budgets/use-budget-queries";
import type {
  BudgetTransactionInput,
  BudgetTransactionStatusInput,
} from "@/lib/hooks/use-finance-budgets/types";
import {
  budgetTransactionEditFormSchema,
  budgetTransactionFormSchema,
  type BudgetTransactionEditFormInput,
  type BudgetTransactionEditFormValues,
  type BudgetTransactionFormInput,
  type BudgetTransactionFormValues,
} from "@/lib/validation/budget.validation";
import type { BudgetCategory } from "@/types/finance";

const FORM_ID = "budget-transaction-form";

const TYPE_OPTIONS = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
  { label: "Refund", value: "refund" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const EMPTY_RECORD_VALUES: BudgetTransactionFormValues = {
  categoryId: "",
  description: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  type: "expense",
  status: "pending",
  vendor: "",
  receiptUrl: "",
  notes: "",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);

export interface BudgetTransactionSheetProps {
  sheet: FormSheetState;
  /** Category choices for the record form. */
  categories: BudgetCategory[];
  onRecord: (input: BudgetTransactionInput) => Promise<unknown>;
  onUpdate: (id: string, input: BudgetTransactionStatusInput) => Promise<unknown>;
}

/**
 * Record/edit sheet for budget transactions (CODING_STANDARD "Dashboard
 * forms"), opened by ?transaction=new / ?transaction=<id>. Create mode
 * records a transaction; edit mode updates status and notes only (money
 * fields are immutable after recording).
 */
export function BudgetTransactionSheet({
  sheet,
  categories,
  onRecord,
  onUpdate,
}: BudgetTransactionSheetProps) {
  const isEdit = sheet.mode === "edit";
  const transactionQuery = useBudgetTransactionQuery(isEdit ? sheet.editId : null);

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const [submitError, setSubmitError] = useState<string | null>(null);

  const recordForm = useForm<BudgetTransactionFormInput, unknown, BudgetTransactionFormValues>({
    resolver: zodResolver(budgetTransactionFormSchema),
    defaultValues: EMPTY_RECORD_VALUES,
  });

  const editForm = useForm<
    BudgetTransactionEditFormInput,
    unknown,
    BudgetTransactionEditFormValues
  >({
    resolver: zodResolver(budgetTransactionEditFormSchema),
    defaultValues: { status: "pending", notes: "" },
  });

  const editingTransaction = transactionQuery.data ?? null;
  const isLoadingEntity = isEdit && !editingTransaction && transactionQuery.isPending;
  const entityMissing = isEdit && !editingTransaction && !transactionQuery.isPending;

  // Re-seed on every open so drafts never leak across open/close cycles.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    setSubmitError(null);
    recordForm.reset(EMPTY_RECORD_VALUES);
  }, [sheet.mode, recordForm]);

  useEffect(() => {
    if (!isEdit || !editingTransaction) return;
    editForm.reset({
      status: editingTransaction.status,
      notes: editingTransaction.notes ?? "",
    });
  }, [isEdit, editingTransaction, editForm]);

  const onRecordSubmit = async (values: BudgetTransactionFormValues) => {
    setSubmitError(null);
    try {
      await onRecord({
        categoryId: values.categoryId,
        description: values.description,
        amount: values.amount.toFixed(2),
        date: values.date,
        type: values.type,
        status: values.status,
        vendor: values.vendor || undefined,
        receiptUrl: values.receiptUrl || undefined,
        notes: values.notes || undefined,
      });
      toast.success("Transaction recorded");
      sheet.close();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to record the transaction.");
    }
  };

  const onEditSubmit = async (values: BudgetTransactionEditFormValues) => {
    if (!editingTransaction) return;
    setSubmitError(null);
    try {
      await onUpdate(editingTransaction.id, {
        status: values.status,
        notes: values.notes || undefined,
      });
      toast.success("Transaction updated");
      sheet.close();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to update the transaction.");
    }
  };

  return (
    <FormSheet
      open={sheet.open}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit transaction" : "Record transaction"}
      description={
        isEdit
          ? "Approve or reject the transaction; money fields stay as recorded."
          : "Log money moving in or out of a budget category."
      }
      footer={
        entityMissing ? undefined : (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={
              isEdit ? editForm.formState.isSubmitting : recordForm.formState.isSubmitting
            }
            onCancel={sheet.close}
            entityLabel="Transaction"
          />
        )
      }
    >
      {isLoadingEntity ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64" />
        </div>
      ) : entityMissing ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              This transaction no longer exists. Close the sheet and refresh the list.
            </AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={sheet.close}>
            Close
          </Button>
        </div>
      ) : isEdit && editingTransaction ? (
        <Form {...editForm}>
          <form
            id={FORM_ID}
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            noValidate
            className="space-y-6 p-6"
          >
            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormSection title="Transaction">
              <div className="rounded-md border p-4 text-sm space-y-1">
                <p className="font-medium">{editingTransaction.description}</p>
                <p className="tabular-nums">{formatCurrency(editingTransaction.amount)}</p>
                <p className="text-muted-foreground">
                  {format(editingTransaction.date, "MMM d, yyyy")}
                </p>
              </div>
              <SelectField
                name="status"
                label="Status"
                options={STATUS_OPTIONS}
                description="Approving counts this transaction toward category spend."
                required
              />
              <TextareaField
                name="notes"
                label="Notes"
                placeholder="Review notes, receipt details"
              />
            </FormSection>
          </form>
        </Form>
      ) : (
        <Form {...recordForm}>
          <form
            id={FORM_ID}
            onSubmit={recordForm.handleSubmit(onRecordSubmit)}
            noValidate
            className="space-y-6 p-6"
          >
            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormSection title="Details">
              <SelectField
                name="categoryId"
                label="Category"
                options={categoryOptions}
                placeholder={categoryOptions.length === 0 ? "Create a category first" : "Select..."}
                disabled={categoryOptions.length === 0}
                required
              />
              <TextField
                name="description"
                label="Description"
                placeholder="Conference venue deposit"
                required
                autoComplete="off"
              />
              <NumberField
                name="amount"
                label="Amount"
                placeholder="0.00"
                min={0}
                step="any"
                required
              />
              <DateField name="date" label="Date" required />
              <SelectField name="type" label="Type" options={TYPE_OPTIONS} required />
            </FormSection>

            <FormSection
              title="Extras"
              description="Optional context: vendor, receipt link, and review notes."
            >
              <TextField
                name="vendor"
                label="Vendor"
                placeholder="Acme Supplies"
                autoComplete="off"
              />
              <TextField
                name="receiptUrl"
                label="Receipt URL"
                type="url"
                placeholder="https://..."
                autoComplete="off"
              />
              <TextareaField
                name="notes"
                label="Notes"
                placeholder="Anything reviewers should know"
              />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}

export default BudgetTransactionSheet;
