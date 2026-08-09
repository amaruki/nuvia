"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useState } from "react";
import BillingTab from "./billing-tab";
import GeneralTab from "./general-tab";
import { defaultMembershipConfig } from "./helpers";
import ModalActions from "./modal-actions";
import NotificationsTab from "./notifications-tab";
import type { MembershipConfig, MembershipConfigModalProps } from "./types";

export function MembershipConfigModal({ open, onOpenChange, onSave }: MembershipConfigModalProps) {
  const [formData, setFormData] = useState<MembershipConfig>(defaultMembershipConfig);

  const handleSave = () => {
    // Basic validation
    if (formData.trialPeriodDays < 0 || formData.trialPeriodDays > 365) {
      alert("Trial period must be between 0 and 365 days");
      return;
    }

    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Membership Configuration</DialogTitle>
              <DialogDescription>
                Configure global membership settings and policies
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <GeneralTab formData={formData} setFormData={setFormData} />

          <BillingTab />

          <NotificationsTab formData={formData} setFormData={setFormData} />
        </Tabs>

        {/* Footer Actions */}
        <ModalActions onCancel={() => onOpenChange(false)} onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
