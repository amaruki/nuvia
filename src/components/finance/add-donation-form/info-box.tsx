import { Info } from "lucide-react";
import type { DonationFormData } from "@/types/finance";

interface InfoBoxProps {
  donationType: DonationFormData["donationType"];
}

export function InfoBox({ donationType }: InfoBoxProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Important:</strong> All donations are processed securely and receipts are
            automatically generated.
          </p>
          {donationType === "recurring" && (
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Recurring donations will be processed monthly and can be cancelled at any time.
            </p>
          )}
          {donationType === "pledge" && (
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Pledges are commitments to donate and will be marked as pending until payment is
              received.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
