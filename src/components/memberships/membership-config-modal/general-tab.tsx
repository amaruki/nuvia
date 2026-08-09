import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, SetStateAction } from "react";
import type { MembershipConfig } from "./types";

interface GeneralTabProps {
  formData: MembershipConfig;
  setFormData: Dispatch<SetStateAction<MembershipConfig>>;
}

export default function GeneralTab({ formData, setFormData }: GeneralTabProps) {
  return (
    <TabsContent value="general" className="space-y-4 mt-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultTier">Default Membership Tier</Label>
          <Select
            value={formData.defaultTier}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultTier: value }))}
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
            onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentGateway: value }))}
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
  );
}
