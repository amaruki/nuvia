"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { ActivityList } from "./_components/activity-list";
import { ActivityPagination } from "./_components/activity-pagination";
import type { LoginActivity, LoginActivitiesResponse } from "./_components/types";

export default function LoginActivitiesPage() {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchLoginActivities(currentPage);
  }, [currentPage]);

  const fetchLoginActivities = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you would get the user ID from the session
      const userId = "user-id-placeholder"; // This would come from authentication

      const response = await fetch(`/api/v1/auth/login-activities?page=${page}&limit=10`, {
        headers: {
          "x-user-id": userId,
        },
      });

      const data: LoginActivitiesResponse = await response.json();

      if (data.success) {
        setActivities(data.data.activities);
        setTotalPages(data.data.pagination.pages);
        setTotalItems(data.data.pagination.total);
      } else {
        setError(data.message || "Failed to fetch login activities");
      }
    } catch (err) {
      setError("An error occurred while fetching login activities");
      logger.error("Failed to fetch login activities", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Login Activity</h1>
        <p className="text-foreground/70 mt-2">
          View your recent login attempts and account access history.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-destructive"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <div className="mt-2 text-sm text-destructive">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ActivityList activities={activities} />
          {totalPages > 1 && (
            <ActivityPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
