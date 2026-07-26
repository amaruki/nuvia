"use client";

import { MembershipFilter } from "@/components/memberships/membership-filter";
import { MembershipList } from "@/components/memberships/membership-list";
import { useHeader } from "@/contexts/dashboard-context";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { MembershipFilter as MembershipFilterType, MembershipSort } from "@/types/membership.types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MembershipDirectory() {
  const { members, error, total, hasMore, filters, sort, updateFilters, updateSort, loadMore } =
    useMemberships({
      pageSize: 12,
      initialSort: { field: "name", direction: "asc" },
    });

  const params = useParams();
  const { setHeader, clearHeader } = useHeader();
  const [isLoading, setIsLoading] = useState(true);
  // Set header and active tab from URL parameter if available
  useEffect(() => {
    // Set the header
    setHeader({
      title: "Member Directory",
      description:
        "Browse and search through our community of members. Connect with professionals in your field and expand your network",
    });

    setIsLoading(false);

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [params.tab, setHeader, clearHeader]);

  const handleFiltersChange = (newFilters: MembershipFilterType) => {
    updateFilters(newFilters);
  };

  const handleSortChange = (newSort: MembershipSort) => {
    updateSort(newSort);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Members</h2>
          <p className="text-red-600 mb-4">
            {error.message || "Failed to load membership directory. Please try again later."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Filters */}
      <MembershipFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
      />

      {/* Members List */}
      <MembershipList
        members={members}
        isLoading={isLoading}
        total={total}
        filters={filters}
        sort={sort}
        onSortChange={handleSortChange}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </div>
  );
}
