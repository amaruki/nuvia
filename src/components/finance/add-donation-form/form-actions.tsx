import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { DonationFormData } from "@/types/finance";
import type { DonorInfo } from "./types";

interface FormActionsProps {
  formData: DonationFormData;
  donorInfo: DonorInfo;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function FormActions({ formData, donorInfo, isSubmitting, onCancel }: FormActionsProps) {
  return (
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
        onClick={onCancel}
        disabled={isSubmitting}
      >
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </div>
  );
}
