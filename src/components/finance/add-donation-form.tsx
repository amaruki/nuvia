"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Building,
  UserX,
  Gift,
  Repeat,
  HandHeart,
  Target,
  DollarSign,
  Mail,
  Calendar,
  FileText,
  Plus,
  X,
  CreditCard,
  Bell,
  Info,
} from "lucide-react";
import { DonationFormData, DonationCampaign } from "@/types/finance";
import { logger } from "@/lib/logger";

interface AddDonationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DonationFormData) => void;
  campaigns: DonationCampaign[];
}

export function AddDonationForm({ open, onOpenChange, onSubmit, campaigns }: AddDonationFormProps) {
  const [formData, setFormData] = useState<DonationFormData>({
    donorId: "",
    donorType: "individual",
    donationType: "one_time",
    campaign: "",
    amount: 0,
    currency: "USD",
    notes: "",
  });

  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
  });

  const [sendReceipt, setSendReceipt] = useState(true);
  const [sendThankYou, setSendThankYou] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        donorId: "",
        donorType: "individual",
        donationType: "one_time",
        campaign: "",
        amount: 0,
        currency: "USD",
        notes: "",
      });
      setDonorInfo({ name: "", email: "" });
      setSendReceipt(true);
      setSendThankYou(true);
      setIsSubmitting(false);
    }
  }, [open]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate a simple donor ID based on email or name
    const donorId = donorInfo.email || donorInfo.name || `donor-${Date.now()}`;

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        donorId,
        sendReceipt,
        sendThankYou,
      });

      // Reset form
      setFormData({
        donorId: "",
        donorType: "individual",
        donationType: "one_time",
        campaign: "",
        amount: 0,
        currency: "USD",
        notes: "",
      });
      setDonorInfo({ name: "", email: "" });
      onOpenChange(false);
    } catch (error) {
      logger.error("Error adding donation", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDonorTypeIcon = (donorType: string) => {
    switch (donorType) {
      case "individual":
        return User;
      case "organization":
        return Building;
      case "anonymous":
        return UserX;
      default:
        return User;
    }
  };

  const getDonationTypeIcon = (donationType: string) => {
    switch (donationType) {
      case "one_time":
        return Gift;
      case "recurring":
        return Repeat;
      case "pledge":
        return HandHeart;
      default:
        return Gift;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 shrink-0" />
            Add New Donation
          </DialogTitle>
          <DialogDescription>Record a new donation or pledge</DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Donor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Donor Information</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="donorType">Donor Type</Label>
                <Select
                  value={formData.donorType}
                  onValueChange={(value: "individual" | "organization" | "anonymous") =>
                    setFormData((prev) => ({ ...prev, donorType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select donor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Individual
                      </div>
                    </SelectItem>
                    <SelectItem value="organization">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Organization
                      </div>
                    </SelectItem>
                    <SelectItem value="anonymous">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        Anonymous
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.donorType !== "anonymous" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="donorName">Donor Name</Label>
                    <Input
                      id="donorName"
                      placeholder="Enter donor name"
                      value={donorInfo.name}
                      onChange={(e) => setDonorInfo((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donorEmail">Email Address</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </>
              )}

              {formData.donorType === "anonymous" && (
                <div className="space-y-2">
                  <Label htmlFor="anonymousEmail">Contact Email (Optional)</Label>
                  <Input
                    id="anonymousEmail"
                    type="email"
                    placeholder="anonymous@example.com"
                    value={donorInfo.email}
                    onChange={(e) => setDonorInfo((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Donation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Donation Details</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="donationType">Donation Type</Label>
                <Select
                  value={formData.donationType}
                  onValueChange={(value: "one_time" | "recurring" | "pledge") =>
                    setFormData((prev) => ({ ...prev, donationType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select donation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        One Time
                      </div>
                    </SelectItem>
                    <SelectItem value="recurring">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Recurring
                      </div>
                    </SelectItem>
                    <SelectItem value="pledge">
                      <div className="flex items-center gap-2">
                        <HandHeart className="h-4 w-4" />
                        Pledge
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select
                  value={formData.campaign}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, campaign: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Donation</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.name}>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {campaign.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="pl-10"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {formData.amount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatted: {formatCurrency(formData.amount)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this donation..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {formData.amount > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Summary</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Donor Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {formData.donorType}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Donation Type:</span>
                    <Badge variant="outline" className="capitalize">
                      {formData.donationType.replace("_", " ")}
                    </Badge>
                  </div>
                  {formData.campaign && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Campaign:</span>
                      <span className="text-sm">{formData.campaign}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Amount:</span>
                    <span className="text-lg font-semibold">{formatCurrency(formData.amount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> All donations are processed securely and receipts are
                  automatically generated.
                </p>
                {formData.donationType === "recurring" && (
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Recurring donations will be processed monthly and can be cancelled at any time.
                  </p>
                )}
                {formData.donationType === "pledge" && (
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Pledges are commitments to donate and will be marked as pending until payment is
                    received.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={
                isSubmitting ||
                formData.amount <= 0 ||
                (formData.donorType !== "anonymous" && (!donorInfo.name || !donorInfo.email))
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Adding..." : "Add Donation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
