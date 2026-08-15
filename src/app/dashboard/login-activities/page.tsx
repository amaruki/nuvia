"use client";

import { useEffect } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTablePagination, useDataTableState } from "@/components/data-table";
import { getActivityIcon } from "@/lib/utils/activity-icons";
import { formatDate } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";
import { useHeader } from "@/contexts/dashboard-context";
import type { LoginActivity, LoginActivitiesResponse } from "./_components/types";

function getDeviceName(userAgent: string) {
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
}

const activityColumns: ColumnDef<LoginActivity>[] = [
  {
    id: "device",
    accessorFn: (row) => getDeviceName(row.userAgent),
    header: "Device",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {getActivityIcon(row.original.successful, row.original.deviceType)}
        <span className="text-sm font-medium">{getDeviceName(row.original.userAgent)}</span>
      </div>
    ),
  },
  {
    accessorKey: "successful",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => (
      <span
        className={cn(
          "text-xs font-medium",
          row.original.successful ? "text-success" : "text-destructive",
        )}
      >
        {row.original.successful ? "Successful" : "Failed"}
      </span>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.location && row.original.location !== "Unknown"
        ? row.original.location
        : "Location Unknown",
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
    enableSorting: false,
  },
  {
    accessorKey: "loginAt",
    header: "Date",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.loginAt, "MMM d, yyyy h:mm a")}
      </span>
    ),
  },
];

export default function LoginActivitiesPage() {
  const { state, setPage, setPageSize } = useDataTableState({ defaultPageSize: 10 });

  // Read-only audit list: the route scopes results to the session user, so
  // only page/limit travel to the API.
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["login-activities", state.page, state.pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/auth/login-activities?page=${state.page}&limit=${state.pageSize}`,
      );
      const body: LoginActivitiesResponse = await response.json();
      if (!body.success) {
        throw new Error(body.message || "Failed to fetch login activities");
      }
      return body.data;
    },
    placeholderData: keepPreviousData,
  });

  const totalPages = Math.max(1, data?.pagination.pages ?? 1);

  const { setHeader, clearHeader } = useHeader();

  useEffect(() => {
    setHeader({
      title: "Login Activity",
      description: "View your recent login attempts and account access history.",
    });
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  return (
    <div className="space-y-6">
      <DataTable
        columns={activityColumns}
        data={data?.activities ?? []}
        loading={isPending}
        error={
          error ? (error instanceof Error ? error.message : "Failed to load activities.") : null
        }
        onRetry={() => void refetch()}
        caption="Login attempts on your account"
        getRowId={(activity) => activity.id}
        pagination={
          <DataTablePagination
            page={Math.min(state.page, totalPages)}
            pageCount={totalPages}
            total={data?.pagination.total ?? 0}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />
    </div>
  );
}
