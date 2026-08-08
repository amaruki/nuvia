"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthStatus, UserStatus } from "@/types/user-management.types";
import type { UserRole } from "@/types/dashboard.types";
import UserFilterAuthSection from "./auth-section";
import { getActiveFiltersCount } from "./helpers";
import UserFilterLocationSection from "./location-section";
import UserFilterRoleSection from "./role-section";
import UserFilterSearchBar from "./search-bar";
import UserFilterStatusSection from "./status-section";
import type { UserFilterProps } from "./types";
import UserFilterVerificationSection from "./verification-section";

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

  const activeFiltersCount = getActiveFiltersCount(filters);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <UserFilterSearchBar value={searchValue} onChange={handleSearchChange} />

      <Separator />

      {/* Filter Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UserFilterRoleSection selectedRoles={filters.roles} onRoleChange={handleRoleChange} />
        <UserFilterStatusSection
          selectedStatuses={filters.statuses}
          onStatusChange={handleStatusChange}
        />
        <UserFilterAuthSection
          selectedAuthStatuses={filters.authStatuses}
          onAuthStatusChange={handleAuthStatusChange}
        />
        <UserFilterVerificationSection
          title="Email Verification"
          icon={<Mail className="size-4" />}
          idPrefix="email"
          value={filters.emailVerified}
          onChange={handleEmailVerifiedChange}
        />
        <UserFilterVerificationSection
          title="Phone Verification"
          icon={<Phone className="size-4" />}
          idPrefix="phone"
          value={filters.phoneVerified}
          onChange={handlePhoneVerifiedChange}
        />
        <UserFilterLocationSection
          locations={filters.locations}
          onAdd={handleLocationAdd}
          onRemove={handleLocationRemove}
        />
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
