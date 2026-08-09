"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Eye, Flag, MoreHorizontal, RefreshCw, ShieldAlert } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ForumLayout } from "./forum-layout";
import {
  DataTable,
  DataTableFacetedFilter,
  DataTablePagination,
  useDataTableState,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import type { Report } from "@/types/forum.types";
import { useForumReports, useResolveReport } from "@/lib/hooks/use-forums";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";

const REPORT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "DISMISSED", label: "Dismissed" },
];

export function ReportList() {
  const { state, setColumnFilters, setPage, setPageSize } = useDataTableState({
    filterParams: { status: "status" },
  });
  const statusValue = state.columnFilters.find((filter) => filter.id === "status")?.value as
    | string[]
    | undefined;
  // The reports endpoint takes a single status filter; forward the first pick.
  const statusFilter = statusValue && statusValue.length > 0 ? statusValue[0] : undefined;

  const {
    data: reportsPage,
    isLoading,
    isFetching,
    refetch,
  } = useForumReports(state.page, state.pageSize, statusFilter);
  const reports = reportsPage?.items ?? [];
  const totalPages = Math.max(1, reportsPage?.totalPages ?? 1);

  const resolveReport = useResolveReport();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleResolve = (id: string, deleteContent = false) => {
    resolveReport.mutate(
      { id, action: "RESOLVED", deleteContent },
      {
        onError: (error) => logger.error("Failed to resolve report", error),
      },
    );
  };

  const columns: ColumnDef<Report>[] = [
    {
      id: "target",
      accessorFn: (row) => row.targetContent?.title ?? row.targetContent?.content ?? "",
      header: "Target",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-medium">
            {row.original.targetType}
          </Badge>
          <span
            className="truncate max-w-[200px]"
            title={row.original.targetContent?.title || row.original.targetContent?.content}
          >
            {row.original.targetContent?.title ||
              row.original.targetContent?.content?.substring(0, 30) + "..."}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      enableSorting: false,
    },
    {
      id: "reportedBy",
      accessorFn: (row) => row.reportedBy.name,
      header: "Reported By",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-xs">
              {row.original.reportedBy.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{row.original.reportedBy.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "PENDING" ? "destructive" : "default"}
          className={cn(
            row.original.status === "PENDING" &&
              "bg-red-100 text-red-700 hover:bg-red-100 border-red-200 font-medium",
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt,
      header: "Date",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(row.original.createdAt))} ago
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedReport(row.original);
                  setIsDetailsOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === "PENDING" && (
                <DropdownMenuItem onClick={() => handleResolve(row.original.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Resolved
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <ForumLayout
      title="User Reports"
      description="Investigate and resolve reports from the community."
      total={reportsPage?.total ?? 0}
      actions={
        <Button variant="outline" onClick={() => void refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={reports}
        loading={isLoading}
        caption="Community content reports"
        manualSorting
        manualFiltering
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getRowId={(report) => report.id}
        emptyTitle="No reports found"
        emptyDescription="Great job! There are no active reports at this time."
        emptyIcon={<Flag className="size-8 text-muted-foreground" />}
        toolbar={(table) => (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={REPORT_STATUS_OPTIONS}
          />
        )}
        pagination={
          <DataTablePagination
            page={Math.min(state.page, totalPages)}
            pageCount={totalPages}
            total={reportsPage?.total ?? 0}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Report Details</SheetTitle>
            <SheetDescription>Review the reported content and take action.</SheetDescription>
          </SheetHeader>
          {selectedReport && (
            <div className="grid gap-6 py-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-lg space-y-2 border border-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="font-medium">
                      {selectedReport.targetType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ID: {selectedReport.targetId}
                    </span>
                  </div>
                  {selectedReport.targetContent?.title && (
                    <h4 className="font-semibold">{selectedReport.targetContent.title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                    {selectedReport.targetContent?.content}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Reason</Label>
                    <p className="font-medium text-destructive flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" />
                      {selectedReport.reason}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Reported By</Label>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-xs">
                          {selectedReport.reportedBy.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm">{selectedReport.reportedBy.name}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="pt-1">
                      <Badge
                        variant={selectedReport.status === "PENDING" ? "destructive" : "secondary"}
                        className="font-medium"
                      >
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="flex-col sm:flex-col gap-2 mt-4">
                {selectedReport.status === "PENDING" ? (
                  <>
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        handleResolve(selectedReport.id);
                        setIsDetailsOpen(false);
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolve Report (Ignore)
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        handleResolve(selectedReport.id, true);
                        setIsDetailsOpen(false);
                      }}
                    >
                      Delete Content & Resolve
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                )}
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ForumLayout>
  );
}
