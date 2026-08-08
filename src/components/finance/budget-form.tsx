"use client";

import { useState } from "react";
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
import { Plus, X } from "lucide-react";
import { BudgetFormData, BudgetCategory } from "@/types/finance";

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => void;
  editingCategory?: BudgetCategory | null;
  periods: Array<{ id: string; name: string }>;
}

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
  const [formData, setFormData] = useState<BudgetFormData>({
    categoryId: editingCategory?.id,
    name: editingCategory?.name || "",
    description: editingCategory?.description || "",
    allocatedAmount: editingCategory?.allocatedAmount || 0,
    period: "",
    color: editingCategory?.color || "hsl(var(--primary))",
    subcategories:
      editingCategory?.subcategories?.map((sub) => ({
        name: sub.name,
        allocatedAmount: sub.allocatedAmount,
      })) || [],
  });

  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    allocatedAmount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      categoryId: undefined,
      name: "",
      description: "",
      allocatedAmount: 0,
      period: "",
      color: "var(--primary)",
      subcategories: [],
    });
    setNewSubcategory({ name: "", allocatedAmount: 0 });
  };

  const addSubcategory = () => {
    if (newSubcategory.name && newSubcategory.allocatedAmount > 0) {
      setFormData((prev) => ({
        ...prev,
        subcategories: [...(prev.subcategories || []), { ...newSubcategory }],
      }));
      setNewSubcategory({ name: "", allocatedAmount: 0 });
    }
  };

  const removeSubcategory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subcategories: (prev.subcategories || []).filter((_, i) => i !== index),
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Budget Period</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter category description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocatedAmount">Allocated Amount</Label>
              <Input
                id="allocatedAmount"
                type="number"
                value={formData.allocatedAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allocatedAmount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {categoryColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Subcategories</Label>
              <Badge variant="secondary">{formData.subcategories?.length || 0} subcategories</Badge>
            </div>

            <div className="space-y-2">
              {(formData.subcategories || []).map((subcategory, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <span className="flex-1">{subcategory.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(subcategory.allocatedAmount)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubcategory(index)}
                  >
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
            <Button type="submit">{editingCategory ? "Update Category" : "Create Category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
