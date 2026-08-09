"use client";

import { useCallback, useState } from "react";

import type { MembershipFilter } from "@/types/membership.types";

// Helper hook for filter state management
export function useMembershipFilters(initialFilters: MembershipFilter = {}) {
  const [filters, setFilters] = useState<MembershipFilter>(initialFilters);

  const updateFilters = useCallback((newFilters: MembershipFilter) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key as keyof MembershipFilter];
      return (
        value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
      );
    });
  }, [filters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
