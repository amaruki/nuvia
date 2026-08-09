"use client";

import { MembershipFilter } from "@/components/memberships/membership-filter";
import { MembershipList } from "@/components/memberships/membership-list";
import { useHeader } from "@/contexts/dashboard-context";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function MembershipDirectory() {
  const {
    members,
    error,
    total,
    totalPages,
    page,
    isFetching,
    filters,
    sort,
    updateFilters,
    updateSort,
    setPage,
  } = useMemberships({
    pageSize: 12,
    initialSort: { field: "name", direction: "asc" },
  });

  const params = useParams();
  const { setHeader, clearHeader } = useHeader();
  // Set header and active tab from URL parameter if available
  useEffect(() => {
    // Set the header
    setHeader({
      title: "Member Directory",
      description:
        "Browse and search through our community of members. Connect with professionals in your field and expand your network",
    });

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [params.tab, setHeader, clearHeader]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Filters */}
      <MembershipFilter filters={filters} onFiltersChange={updateFilters} isLoading={isFetching} />

      {/* Members List — server-paginated cards (UI-09 Tier A) */}
      <MembershipList
        members={members}
        isLoading={isFetching}
        isFetching={isFetching}
        total={total}
        totalPages={totalPages}
        page={page}
        onPageChange={setPage}
        filters={filters}
        sort={sort}
        onSortChange={updateSort}
      />
    </div>
  );
}
