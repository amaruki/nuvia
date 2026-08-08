import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { UserStatus } from "@/types/user-management.types";
import FilterSection from "./filter-section";
import { formatFilterLabel } from "./helpers";
import type { UserFilterStatusSectionProps } from "./types";

export default function UserFilterStatusSection({
  selectedStatuses,
  onStatusChange,
}: UserFilterStatusSectionProps) {
  return (
    <FilterSection title="User Status" icon={<Shield className="size-4" />}>
      <div className="space-y-3">
        {Object.values(UserStatus).map((status) => (
          <div key={status} className="flex items-center space-x-2">
            <Checkbox
              id={`status-${status}`}
              checked={selectedStatuses?.includes(status) || false}
              onCheckedChange={(checked) => onStatusChange(status, checked as boolean)}
            />
            <Label htmlFor={`status-${status}`} className="text-sm font-normal">
              {formatFilterLabel(status)}
            </Label>
          </div>
        ))}
      </div>
    </FilterSection>
  );
}
