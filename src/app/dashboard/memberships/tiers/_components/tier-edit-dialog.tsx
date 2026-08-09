"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  createTierRequest,
  deleteTierRequest,
  updateTierRequest,
  type BillingCycle,
  type TierDto,
} from "./tiers-api";

interface TierEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing tier to edit, or null to create a new one. */
  tier: TierDto | null;
  onSaved: (tier: TierDto) => void;
  onDeleted: (tierId: string) => void;
}

interface TierFormState {
  name: string;
  displayName: string;
  description: string;
  price: string;
  billingCycle: BillingCycle;
  features: string; // one entry per line
  benefits: string; // one entry per line
  color: string;
  sortOrder: string;
  trialDays: string;
  isActive: boolean;
}

function seedFormState(tier: TierDto | null): TierFormState {
  if (!tier) {
    return {
      name: "",
      displayName: "",
      description: "",
      price: "0.00",
      billingCycle: "monthly",
      features: "",
      benefits: "",
      color: "",
      sortOrder: "0",
      trialDays: "0",
      isActive: true,
    };
  }
  return {
    name: tier.name,
    displayName: tier.displayName,
    description: tier.description ?? "",
    price: tier.price,
    billingCycle: tier.billingCycle,
    features: tier.features.join("\n"),
    benefits: tier.benefits.join("\n"),
    color: tier.color ?? "",
    sortOrder: String(tier.sortOrder),
    trialDays: String(tier.trialDays),
    isActive: tier.isActive,
  };
}

/** Splits a one-entry-per-line textarea into a trimmed string list. */
function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Normalizes user price input into the money-string shape the API expects. */
function normalizePrice(value: string): string | null {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed.toFixed(2);
}

export function TierEditDialog({
  open,
  onOpenChange,
  tier,
  onSaved,
  onDeleted,
}: TierEditDialogProps) {
  const isEditing = tier !== null;
  const [form, setForm] = React.useState<TierFormState>(() => seedFormState(tier));
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(seedFormState(tier));
      setConfirmingDelete(false);
    }
  }, [open, tier]);

  const setField = <K extends keyof TierFormState>(key: K, value: TierFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const displayName = form.displayName.trim();
    const price = normalizePrice(form.price);
    const sortOrder = Number(form.sortOrder);
    const trialDays = Number(form.trialDays);

    if (!name) return toast.error("Tier name is required");
    if (!displayName) return toast.error("Display name is required");
    if (price === null) return toast.error("Price must be a non-negative number");
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return toast.error("Sort order must be a non-negative whole number");
    }
    if (!Number.isInteger(trialDays) || trialDays < 0) {
      return toast.error("Trial days must be a non-negative whole number");
    }

    const input = {
      name,
      displayName,
      description: form.description.trim() || undefined,
      price,
      billingCycle: form.billingCycle,
      features: linesToList(form.features),
      benefits: linesToList(form.benefits),
      color: form.color.trim() || null,
      sortOrder,
      trialDays,
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      const saved = isEditing
        ? await updateTierRequest(tier.id, input)
        : await createTierRequest(input);
      toast.success(isEditing ? "Tier updated" : "Tier created");
      onOpenChange(false);
      onSaved(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tier) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteTierRequest(tier.id);
      toast.success("Tier deleted");
      onOpenChange(false);
      onDeleted(tier.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete tier — deactivate it instead if members still reference it",
      );
    } finally {
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Membership Tier" : "Add Membership Tier"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Changes persist through the finance tiers API."
              : "The new tier is created through the finance tiers API."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tier-name">Name (identifier)</Label>
              <Input
                id="tier-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="basic"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tier-displayName">Display Name</Label>
              <Input
                id="tier-displayName"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                placeholder="Basic Member"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tier-description">Description</Label>
            <Textarea
              id="tier-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tier-price">Price (USD)</Label>
              <Input
                id="tier-price"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="29.00"
                inputMode="decimal"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tier-billingCycle">Billing Cycle</Label>
              <select
                id="tier-billingCycle"
                value={form.billingCycle}
                onChange={(e) => setField("billingCycle", e.target.value as BillingCycle)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input focus:outline-none focus:ring-ring focus:border-primary sm:text-sm rounded-md"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="tier-features">Features (one per line)</Label>
            <Textarea
              id="tier-features"
              value={form.features}
              onChange={(e) => setField("features", e.target.value)}
              rows={3}
              placeholder={"Member directory access\nEvent registration"}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tier-benefits">Benefits (one per line)</Label>
            <Textarea
              id="tier-benefits"
              value={form.benefits}
              onChange={(e) => setField("benefits", e.target.value)}
              rows={3}
              placeholder={"Discounted events\nMentorship matching"}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="tier-color">Color</Label>
              <Input
                id="tier-color"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                placeholder="blue"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tier-sortOrder">Sort Order</Label>
              <Input
                id="tier-sortOrder"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", e.target.value)}
                inputMode="numeric"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tier-trialDays">Trial Days</Label>
              <Input
                id="tier-trialDays"
                value={form.trialDays}
                onChange={(e) => setField("trialDays", e.target.value)}
                inputMode="numeric"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="tier-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive tiers stay in the database but are hidden from public lists.
              </p>
            </div>
            <Switch
              id="tier-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setField("isActive", checked)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEditing ? (
            <Button
              variant={confirmingDelete ? "destructive" : "ghost"}
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {confirmingDelete ? "Confirm delete" : "Delete"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Tier"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
