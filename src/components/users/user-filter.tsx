"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  UserFilter as UserFilterType,
  UserStatus,
  AuthStatus,
} from "@/types/user-management.types";
import { type UserRole, ROLE_DISPLAY_INFO, isPredefinedRole } from "@/types/dashboard.types";
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Calendar,
  MapPin,
  Shield,
  Mail,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFilterProps {
  filters: UserFilterType;
  onFilterChange: (filters: UserFilterType) => void;
  onClearFilters?: () => void;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({ title, icon, defaultOpen = true, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function UserFilter({
  filters,
  onFilterChange,
  onClearFilters,
  className,
}: UserFilterProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFilterChange({ ...filters, search: value || undefined });
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = filters.roles || [];
    const newRoles = checked ? [...currentRoles, role] : currentRoles.filter((r) => r !== role);
    onFilterChange({ ...filters, roles: newRoles.length ? newRoles : undefined });
  };

  const handleStatusChange = (status: UserStatus, checked: boolean) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);
    onFilterChange({ ...filters, statuses: newStatuses.length ? newStatuses : undefined });
  };

  const handleAuthStatusChange = (authStatus: AuthStatus, checked: boolean) => {
    const currentAuthStatuses = filters.authStatuses || [];
    const newAuthStatuses = checked
      ? [...currentAuthStatuses, authStatus]
      : currentAuthStatuses.filter((s) => s !== authStatus);
    onFilterChange({
      ...filters,
      authStatuses: newAuthStatuses.length ? newAuthStatuses : undefined,
    });
  };

  const handleEmailVerifiedChange = (verified: boolean | undefined) => {
    onFilterChange({ ...filters, emailVerified: verified });
  };

  const handlePhoneVerifiedChange = (verified: boolean | undefined) => {
    onFilterChange({ ...filters, phoneVerified: verified });
  };

  const handleLocationAdd = (location: string) => {
    if (!location.trim()) return;
    const currentLocations = filters.locations || [];
    const newLocations = [...currentLocations, location.trim()];
    onFilterChange({ ...filters, locations: newLocations });
  };

  const handleLocationRemove = (locationToRemove: string) => {
    const currentLocations = filters.locations || [];
    const newLocations = currentLocations.filter((location) => location !== locationToRemove);
    onFilterChange({ ...filters, locations: newLocations.length ? newLocations : undefined });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.roles?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.authStatuses?.length) count++;
    if (filters.emailVerified !== undefined) count++;
    if (filters.phoneVerified !== undefined) count++;
    if (filters.locations?.length) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Search Users
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name, email, or username..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Filter Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Roles */}
        <FilterSection title="User Roles" icon={<Shield className="size-4" />}>
          <div className="space-y-4">
            {/* Group roles by category */}
            {[
              {
                category: "administrative",
                title: "Administrative",
                roles: ["superadmin", "admin"],
              },
              {
                category: "leadership",
                title: "Leadership",
                roles: ["treasurer", "chapter_president", "chapter_admin", "committee_chair"],
              },
              { category: "staff", title: "Staff", roles: ["staff", "organizer", "moderator"] },
              {
                category: "membership",
                title: "Membership",
                roles: [
                  "member_corporate",
                  "member_professional",
                  "member_student",
                  "member",
                  "user",
                ],
              },
            ].map(({ category, title, roles }) => (
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
                          checked={filters.roles?.includes(role as any) || false}
                          onCheckedChange={(checked) =>
                            handleRoleChange(role as any, checked as boolean)
                          }
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

        {/* User Status */}
        <FilterSection title="User Status" icon={<Shield className="size-4" />}>
          <div className="space-y-3">
            {Object.values(UserStatus).map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.statuses?.includes(status) || false}
                  onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                />
                <Label htmlFor={`status-${status}`} className="text-sm font-normal">
                  {status.replace("_", " ").charAt(0).toUpperCase() +
                    status.replace("_", " ").slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Authentication Status */}
        <FilterSection title="Authentication" icon={<Shield className="size-4" />}>
          <div className="space-y-3">
            {Object.values(AuthStatus).map((authStatus) => (
              <div key={authStatus} className="flex items-center space-x-2">
                <Checkbox
                  id={`auth-${authStatus}`}
                  checked={filters.authStatuses?.includes(authStatus) || false}
                  onCheckedChange={(checked) =>
                    handleAuthStatusChange(authStatus, checked as boolean)
                  }
                />
                <Label htmlFor={`auth-${authStatus}`} className="text-sm font-normal">
                  {authStatus.replace("_", " ").charAt(0).toUpperCase() +
                    authStatus.replace("_", " ").slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Email Verification */}
        <FilterSection title="Email Verification" icon={<Mail className="size-4" />}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-verified"
                checked={filters.emailVerified === true}
                onCheckedChange={() =>
                  handleEmailVerifiedChange(filters.emailVerified === true ? undefined : true)
                }
              />
              <Label htmlFor="email-verified" className="text-sm font-normal">
                Verified
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-unverified"
                checked={filters.emailVerified === false}
                onCheckedChange={() =>
                  handleEmailVerifiedChange(filters.emailVerified === false ? undefined : false)
                }
              />
              <Label htmlFor="email-unverified" className="text-sm font-normal">
                Unverified
              </Label>
            </div>
          </div>
        </FilterSection>

        {/* Phone Verification */}
        <FilterSection title="Phone Verification" icon={<Phone className="size-4" />}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="phone-verified"
                checked={filters.phoneVerified === true}
                onCheckedChange={() =>
                  handlePhoneVerifiedChange(filters.phoneVerified === true ? undefined : true)
                }
              />
              <Label htmlFor="phone-verified" className="text-sm font-normal">
                Verified
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="phone-unverified"
                checked={filters.phoneVerified === false}
                onCheckedChange={() =>
                  handlePhoneVerifiedChange(filters.phoneVerified === false ? undefined : false)
                }
              />
              <Label htmlFor="phone-unverified" className="text-sm font-normal">
                Unverified
              </Label>
            </div>
          </div>
        </FilterSection>

        {/* Location Filter */}
        <FilterSection title="Location" icon={<MapPin className="size-4" />}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add location..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLocationAdd(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleLocationAdd(input.value);
                  input.value = "";
                }}
              >
                Add
              </Button>
            </div>

            {filters.locations && filters.locations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.locations.map((location, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {location}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLocationRemove(location)}
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="size-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </FilterSection>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && onClearFilters && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onClearFilters} className="gap-2">
            <X className="size-4" />
            Clear {activeFiltersCount} Filter{activeFiltersCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
