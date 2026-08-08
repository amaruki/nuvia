import { Badge } from "@/components/ui/badge";
import type { DonationFormData } from "@/types/finance";
import { formatCurrency } from "./helpers";

interface SummarySectionProps {
  formData: DonationFormData;
}

export function SummarySection({ formData }: SummarySectionProps) {
  return (
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
  );
}
