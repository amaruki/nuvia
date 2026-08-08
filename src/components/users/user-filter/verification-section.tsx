import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import FilterSection from "./filter-section";
import type { UserFilterVerificationSectionProps } from "./types";

export default function UserFilterVerificationSection({
  title,
  icon,
  idPrefix,
  value,
  onChange,
}: UserFilterVerificationSectionProps) {
  return (
    <FilterSection title={title} icon={icon}>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${idPrefix}-verified`}
            checked={value === true}
            onCheckedChange={() => onChange(value === true ? undefined : true)}
          />
          <Label htmlFor={`${idPrefix}-verified`} className="text-sm font-normal">
            Verified
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${idPrefix}-unverified`}
            checked={value === false}
            onCheckedChange={() => onChange(value === false ? undefined : false)}
          />
          <Label htmlFor={`${idPrefix}-unverified`} className="text-sm font-normal">
            Unverified
          </Label>
        </div>
      </div>
    </FilterSection>
  );
}
