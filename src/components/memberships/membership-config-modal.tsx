"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Save, CreditCard, Mail, Shield } from "lucide-react";
import { useState } from "react";

interface MembershipConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: MembershipConfig) => void;
}

interface MembershipConfig {
  defaultTier?: string;
  trialPeriodDays: number;
  autoRenewal: boolean;
  cancellationPolicy: string;
  paymentGateway: string;
  currency: string;
  welcomeEmail: boolean;
  upgradeReminders: boolean;
  renewalReminders: boolean;
  defaultPermissions: string[];
}

export function MembershipConfigModal({ open, onOpenChange, onSave }: MembershipConfigModalProps) {
  const [formData, setFormData] = useState<MembershipConfig>({
    defaultTier: "basic",
    trialPeriodDays: 14,
    autoRenewal: true,
    cancellationPolicy: "30 days notice required",
    paymentGateway: "stripe",
    currency: "USD",
    welcomeEmail: true,
    upgradeReminders: true,
    renewalReminders: true,
    defaultPermissions: ["read_profile", "join_events"],
  });

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

          <TabsContent value="general" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultTier">Default Membership Tier</Label>
                <Select
                  value={formData.defaultTier}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, defaultTier: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialPeriod">Trial Period (Days)</Label>
                <Input
                  id="trialPeriod"
                  type="number"
                  value={formData.trialPeriodDays}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      trialPeriodDays: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  max="365"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentGateway">Payment Gateway</Label>
                <Select
                  value={formData.paymentGateway}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentGateway: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="autoRenewal"
                  checked={formData.autoRenewal}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, autoRenewal: checked as boolean }))
                  }
                />
                <Label htmlFor="autoRenewal">Enable Automatic Renewal</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cancellationPolicy: e.target.value }))
                  }
                  placeholder="Describe your cancellation policy..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Billing Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure payment and billing options
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Default Billing Cycle</Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lateFee">Late Fee Percentage</Label>
                  <Input
                    id="lateFee"
                    type="number"
                    defaultValue="10"
                    placeholder="10"
                    min="0"
                    max="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    defaultValue="7"
                    placeholder="7"
                    min="0"
                    max="30"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure automated email communications
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="welcomeEmail"
                    checked={formData.welcomeEmail}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, welcomeEmail: checked as boolean }))
                    }
                  />
                  <Label htmlFor="welcomeEmail">Send welcome email to new members</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="upgradeReminders"
                    checked={formData.upgradeReminders}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, upgradeReminders: checked as boolean }))
                    }
                  />
                  <Label htmlFor="upgradeReminders">Send upgrade reminders</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="renewalReminders"
                    checked={formData.renewalReminders}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, renewalReminders: checked as boolean }))
                    }
                  />
                  <Label htmlFor="renewalReminders">Send renewal reminders</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Notification Email</Label>
                <Input id="adminEmail" type="email" placeholder="admin@example.com" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
