"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils/date-utils";
import { getActivityIcon } from "@/lib/utils/activity-icons";
import { logger } from "@/lib/logger";

interface LoginActivity {
  id: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  location: string;
  successful: boolean;
  loginAt: string;
}

interface LoginActivitiesResponse {
  success: boolean;
  data: {
    activities: LoginActivity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
  errors: Record<string, string[]> | undefined;
  meta: {
    timestamp: string;
    version: string;
  };
}

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

  const getDeviceName = (userAgent: string) => {
    // Simple device detection based on user agent
    if (userAgent.includes("Mobile")) {
      return "Mobile Device";
    } else if (userAgent.includes("Tablet")) {
      return "Tablet";
    } else if (userAgent.includes("Windows")) {
      return "Windows PC";
    } else if (userAgent.includes("Mac")) {
      return "Mac";
    } else if (userAgent.includes("Linux")) {
      return "Linux PC";
    }
    return "Unknown Device";
  };

  const formatLocation = (location: string) => {
    if (!location || location === "Unknown") {
      return "Location Unknown";
    }
    return location;
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
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {activities.length === 0 ? (
                <li className="px-6 py-4 text-center text-foreground/50">
                  No login activity found
                </li>
              ) : (
                activities.map((activity) => (
                  <li key={activity.id}>
                    <div className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.successful, activity.deviceType)}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary truncate">
                              {getDeviceName(activity.userAgent)}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p
                                className={`text-xs font-medium ${
                                  activity.successful ? "text-success" : "text-destructive"
                                }`}
                              >
                                {activity.successful ? "Successful" : "Failed"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-foreground/50">
                                <svg
                                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-foreground/40"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {formatLocation(activity.location)}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-foreground/50 sm:mt-0 sm:ml-6">
                                <svg
                                  className="flex-shrink-0 mr-1.5 h-5 w-5 text-foreground/40"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {activity.ipAddress}
                              </p>
                            </div>
                            <div className="text-sm text-foreground/50">
                              {formatDate(activity.loginAt, "MMM d, yyyy h:mm a")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-card text-foreground/70 hover:bg-background"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-card text-foreground/70 hover:bg-background"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-foreground/70">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{" "}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium ${
                        currentPage === 1
                          ? "text-foreground/30 cursor-not-allowed"
                          : "text-foreground/50 hover:bg-background"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-primary/10 border-primary text-primary"
                              : "bg-card border-border text-foreground/50 hover:bg-background"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-foreground/30 cursor-not-allowed"
                          : "text-foreground/50 hover:bg-background"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
