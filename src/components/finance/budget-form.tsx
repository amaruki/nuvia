"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  budgetCategorySchema,
  type BudgetCategoryFormValues,
} from "@/lib/validation/finance.validation";
import type { BudgetFormData, BudgetCategory } from "@/types/finance";

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => void;
  editingCategory?: BudgetCategory | null;
  periods: Array<{ id: string; name: string }>;
}

type BudgetCategoryInput = z.input<typeof budgetCategorySchema>;

const categoryColors = [
  { name: "Primary", value: "var(--primary)" },
  { name: "Secondary", value: "var(--secondary)" },
  { name: "Destructive", value: "var(--destructive)" },
  { name: "Muted", value: "var(--muted)" },
  { name: "Accent", value: "var(--accent)" },
  { name: "Chart 1", value: "var(--chart-1)" },
  { name: "Chart 2", value: "var(--chart-2)" },
  { name: "Chart 3", value: "var(--chart-3)" },
  { name: "Chart 4", value: "var(--chart-4)" },
  { name: "Chart 5", value: "var(--chart-5)" },
];

export function BudgetForm({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
  periods,
}: BudgetFormProps) {
  const defaultValues = useMemo<BudgetCategoryInput>(
    () => ({
      name: editingCategory?.name ?? "",
      period: "",
      description: editingCategory?.description ?? "",
      allocatedAmount: editingCategory?.allocatedAmount ?? 0,
      // Concrete default: the light-theme --primary brand color,
      // oklch(0.8012 0.1089 201.1736). The old hsl()-wrapped token fallback
      // was invalid CSS once tokens moved to oklch(), so no color rendered.
      color: editingCategory?.color || "#58d3db",
      subcategories:
        editingCategory?.subcategories?.map((sub) => ({
          name: sub.name,
          allocatedAmount: sub.allocatedAmount,
        })) ?? [],
    }),
    [editingCategory],
  );

  const form = useForm<BudgetCategoryInput, unknown, BudgetCategoryFormValues>({
    resolver: zodResolver(budgetCategorySchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subcategories",
  });

  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    allocatedAmount: 0,
  });

  useEffect(() => {
    form.reset(defaultValues);
    setNewSubcategory({ name: "", allocatedAmount: 0 });
  }, [isOpen, defaultValues, form]);

  const addSubcategory = () => {
    if (newSubcategory.name && newSubcategory.allocatedAmount > 0) {
      append({
        name: newSubcategory.name,
        allocatedAmount: newSubcategory.allocatedAmount,
      });
      setNewSubcategory({ name: "", allocatedAmount: 0 });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const onValid = (values: BudgetCategoryFormValues) => {
    const payload: BudgetFormData = {
      ...values,
      categoryId: editingCategory?.id,
    };
    onSubmit(payload);
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Edit Budget Category" : "Create Budget Category"}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? "Update the budget category details and allocation."
              : "Create a new budget category and set its allocation."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onValid)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter category name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Period</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Enter category description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="allocatedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocated Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value as number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 flex-wrap">
                        {categoryColors.map((color) => {
                          const selected = field.value === color.value;
                          return (
                            <button
                              key={color.value}
                              type="button"
                              className={cn(
                                "size-8 rounded-full border-2",
                                selected ? "border-foreground" : "border-input",
                              )}
                              style={{ backgroundColor: color.value }}
                              onClick={() => field.onChange(color.value)}
                              aria-pressed={selected}
                              title={color.name}
                              aria-label={color.name}
                            />
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Subcategories</Label>
                <Badge variant="secondary">{fields.length} subcategories</Badge>
              </div>

              <div className="space-y-2">
                {fields.map((subcategory, index) => (
                  <div key={subcategory.id} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{subcategory.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(subcategory.allocatedAmount)}
                    </span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Subcategory name"
                  value={newSubcategory.name}
                  onChange={(e) =>
                    setNewSubcategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newSubcategory.allocatedAmount || ""}
                  onChange={(e) =>
                    setNewSubcategory((prev) => ({
                      ...prev,
                      allocatedAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  step="0.01"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSubcategory}
                  disabled={!newSubcategory.name || newSubcategory.allocatedAmount <= 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
