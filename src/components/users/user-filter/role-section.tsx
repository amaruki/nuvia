import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { ROLE_DISPLAY_INFO, isPredefinedRole } from "@/types/dashboard.types";
import { ROLE_CATEGORY_GROUPS } from "./constants";
import FilterSection from "./filter-section";
import type { UserFilterRoleSectionProps } from "./types";

export default function UserFilterRoleSection({
  selectedRoles,
  onRoleChange,
}: UserFilterRoleSectionProps) {
  return (
    <FilterSection title="User Roles" icon={<Shield className="size-4" />}>
      <div className="space-y-4">
        {/* Group roles by category */}
        {ROLE_CATEGORY_GROUPS.map(({ category, title, roles }) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {title}
            </h4>
            <div className="space-y-2">
              {roles.map((role) => {
                const roleInfo = isPredefinedRole(role) ? ROLE_DISPLAY_INFO[role] : null;
                return (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles?.includes(role) || false}
                      onCheckedChange={(checked) => onRoleChange(role, checked as boolean)}
                    />
                    <Label
                      htmlFor={`role-${role}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-2">
                        {roleInfo ? (
                          <>
                            <span className="font-medium">{roleInfo.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          </>
                        ) : (
                          <span className="capitalize">{role.replace(/_/g, " ")}</span>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </FilterSection>
  );
}
