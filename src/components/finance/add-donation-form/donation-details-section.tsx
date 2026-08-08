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
import { DollarSign, Gift, HandHeart, Repeat, Target } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { DonationCampaign, DonationFormData } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface DonationDetailsSectionProps {
  formData: DonationFormData;
  setFormData: Dispatch<SetStateAction<DonationFormData>>;
  campaigns: DonationCampaign[];
}

export function DonationDetailsSection({
  formData,
  setFormData,
  campaigns,
}: DonationDetailsSectionProps) {
  return (
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
  );
}
