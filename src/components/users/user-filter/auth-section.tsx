import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { AuthStatus } from "@/types/user-management.types";
import FilterSection from "./filter-section";
import { formatFilterLabel } from "./helpers";
import type { UserFilterAuthSectionProps } from "./types";

export default function UserFilterAuthSection({
  selectedAuthStatuses,
  onAuthStatusChange,
}: UserFilterAuthSectionProps) {
  return (
    <FilterSection title="Authentication" icon={<Shield className="size-4" />}>
      <div className="space-y-3">
        {Object.values(AuthStatus).map((authStatus) => (
          <div key={authStatus} className="flex items-center space-x-2">
            <Checkbox
              id={`auth-${authStatus}`}
              checked={selectedAuthStatuses?.includes(authStatus) || false}
              onCheckedChange={(checked) => onAuthStatusChange(authStatus, checked as boolean)}
            />
            <Label htmlFor={`auth-${authStatus}`} className="text-sm font-normal">
              {formatFilterLabel(authStatus)}
            </Label>
          </div>
        ))}
      </div>
    </FilterSection>
  );
}
