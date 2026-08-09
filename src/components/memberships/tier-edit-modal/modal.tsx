"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import AdvancedTab from "./advanced-tab";
import BasicInfoTab from "./basic-info-tab";
import FeaturesTab from "./features-tab";
import { tierIcons } from "./helpers";
import ModalActions from "./modal-actions";
import type { TierEditModalProps } from "./types";

export function TierEditModal({ tier, open, onOpenChange, onSave }: TierEditModalProps) {
  const [formData, setFormData] = useState({
    name: tier?.name || "",
    description: tier?.description || "",
    price: tier?.price || "",
    period: tier?.period || "month",
    status: tier?.status || "active",
    color: tier?.color || "blue",
    visibility: tier?.visibility ?? true,
    features: tier?.features || [],
    benefits: tier?.benefits || [],
    upgradeFrom: tier?.upgradeFrom || [],
    upgradeTo: tier?.upgradeTo || [],
    restrictions: tier?.restrictions || [],
  });

  const [newFeature, setNewFeature] = useState("");

  if (!tier) return null;

  const handleSave = () => {
    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Tier name is required");
      return;
    }

    if (!formData.price.trim()) {
      toast.error("Price is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    onSave({
      ...tier,
      ...formData,
    });
    onOpenChange(false);
  };

  const Icon = tierIcons[tier.tier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Edit {tier.name}</DialogTitle>
              <DialogDescription>Configure membership tier settings</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <BasicInfoTab formData={formData} setFormData={setFormData} />

            <FeaturesTab
              formData={formData}
              setFormData={setFormData}
              newFeature={newFeature}
              setNewFeature={setNewFeature}
            />

            <AdvancedTab formData={formData} setFormData={setFormData} />
          </Tabs>
        </div>

        {/* Footer Actions */}
        <ModalActions onCancel={() => onOpenChange(false)} onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
