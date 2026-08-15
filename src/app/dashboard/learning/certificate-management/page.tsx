"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, Ban, Eye, MoreHorizontal, ShieldCheck, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useHeader } from "@/contexts/dashboard-context";
import {
  DataTable,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableSearch,
  useDataTableState,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLearningCertificatesPage,
  useRevokeCertificate,
} from "@/lib/hooks/use-learning-certificates";
import type { Certificate } from "@/types/learning.types";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Revoked", value: "revoked" },
] as const;

export default function AdminCertificationsPage() {
  const { setHeader, clearHeader } = useHeader();
  const { state, setGlobalFilter, setColumnFilters, setPage, setPageSize } = useDataTableState({
    filterParams: { status: "status" },
  });
  const search = state.globalFilter ?? "";
  const statusValues = state.columnFilters.find((filter) => filter.id === "status")?.value as
    | string[]
    | undefined;
  // The endpoint takes a single status, so forward only the first selected value.
  const statusFilter = statusValues && statusValues.length > 0 ? statusValues[0] : undefined;

  const {
    data: pageData,
    isPending,
    isFetching,
    error,
    refetch,
  } = useLearningCertificatesPage({
    search: search || undefined,
    status: statusFilter,
    page: state.page,
    limit: state.pageSize,
  });
  const certificates = pageData?.certificates ?? [];
  const totalPages = Math.max(1, pageData?.totalPages ?? 1);

  const revokeMutation = useRevokeCertificate();
  const [certificateToRevoke, setCertificateToRevoke] = useState<string | null>(null);
  const isRevokingCertificate = revokeMutation.isPending;

  useEffect(() => {
    setHeader({
      title: "Certification Management",
      description: "Monitor and manage issued certificates across platform.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const activeCertificates = useMemo(
    () => certificates.filter((c) => c.status === "active").length,
    [certificates],
  );
  const revokedCertificates = useMemo(
    () => certificates.filter((c) => c.status === "revoked").length,
    [certificates],
  );

  const confirmRevokeCertificate = async () => {
    if (!certificateToRevoke) return;
    try {
      await revokeMutation.mutateAsync(certificateToRevoke);
      setCertificateToRevoke(null);
    } catch {
      // The hook already toasts the failure; keep the dialog open to retry.
    }
  };

  const columns: ColumnDef<Certificate>[] = [
    {
      accessorKey: "verificationCode",
      header: "Verification ID",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-primary">
          {row.original.verificationCode}
        </span>
      ),
    },
    {
      accessorKey: "studentName",
      header: "Student",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.studentName}</span>
          <span className="text-xs text-muted-foreground">{row.original.studentEmail}</span>
        </div>
      ),
    },
    {
      accessorKey: "courseName",
      header: "Course",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="block max-w-[200px] truncate font-medium text-sm"
          title={row.original.courseName}
        >
          {row.original.courseName}
        </span>
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Issue Date",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.issueDate}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`${
            row.original.status === "active"
              ? "bg-green-500/10 text-green-600 border-green-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          } transition-colors`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-2 ${row.original.status === "active" ? "bg-green-600" : "bg-destructive"}`}
          />
          {row.original.status === "active" ? "Active" : "Revoked"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/learning/certifications/${row.original.id}`}
                  target="_blank"
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                disabled={row.original.status !== "active"}
                onClick={() => setCertificateToRevoke(row.original.id)}
              >
                <Ban className="mr-2 h-4 w-4" /> Revoke Certificate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Award className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageData?.total ?? certificates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Certificates (this page)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCertificates}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revoked (this page)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revokedCertificates}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={certificates}
        loading={isPending}
        error={
          error ? (error instanceof Error ? error.message : "Failed to load certificates.") : null
        }
        onRetry={() => void refetch()}
        caption="Certificates issued across the platform"
        manualSorting
        manualFiltering
        columnFilters={state.columnFilters}
        onColumnFiltersChange={(updater) =>
          setColumnFilters(typeof updater === "function" ? updater(state.columnFilters) : updater)
        }
        getRowId={(cert) => cert.id}
        toolbar={(table) => (
          <div className="flex items-center gap-2 py-4">
            <DataTableSearch
              value={search}
              onValueChange={setGlobalFilter}
              placeholder="Search student, course, or verification ID..."
            />
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={[...STATUS_OPTIONS]}
            />
          </div>
        )}
        pagination={
          <DataTablePagination
            page={Math.min(state.page, totalPages)}
            pageCount={totalPages}
            total={pageData?.total ?? 0}
            pageSize={state.pageSize}
            loading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        }
      />

      <AlertDialog
        open={certificateToRevoke !== null}
        onOpenChange={(open) => {
          if (!open && !isRevokingCertificate) setCertificateToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this certificate?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingCertificate}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isRevokingCertificate || !certificateToRevoke}
              onClick={confirmRevokeCertificate}
            >
              {isRevokingCertificate ? "Revoking..." : "Revoke certificate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
