"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  HandHeart,
  Handshake,
  MoreHorizontal,
  Pencil,
  Repeat,
  User,
  VenetianMask,
  XCircle,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  DataTableViewOptions,
} from "@/components/data-table";
import type { DataTableUrlState } from "@/hooks/use-data-table-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Donation } from "@/types/finance";

/** URL-synced table state owned by the donations page. */
export interface DonationsTableState {
  state: DataTableUrlState;
  setSorting: (sorting: SortingState) => void;
  setGlobalFilter: (value: string) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface DonationsTableProps {
  /** One server-paginated page of donations. */
  donations: Donation[];
  /** Total rows across all pages (from the list meta). */
  total: number;
  /** Total pages (from the list meta). */
  totalPages: number;
  /** True while a page fetch/refetch is in flight (skeleton rows). */
  loading?: boolean;
  error?: string | null;
  onViewDetails?: (donation: Donation) => void;
  onEdit?: (donation: Donation) => void;
  onUpdateStatus?: (donationId: string, status: Donation["status"]) => void;
  onRefresh?: () => void;
  /** URL-synced table state owned by the donations page. */
  tableState: DonationsTableState;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const STATUS_BADGES: Record<
  Donation["status"],
  { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }
> = {
  completed: { variant: "default", icon: CheckCircle },
  pending: { variant: "secondary", icon: Clock },
  failed: { variant: "destructive", icon: XCircle },
  refunded: { variant: "outline", icon: AlertCircle },
  pledged: { variant: "secondary", icon: HandHeart },
};

/** Donor-type icons (UI-13): lucide glyphs with accessible labels. */
const DONOR_TYPE_ICONS: Record<Donation["donorType"], { icon: typeof User; label: string }> = {
  individual: { icon: User, label: "Individual donor" },
  organization: { icon: Building2, label: "Organization donor" },
  anonymous: { icon: VenetianMask, label: "Anonymous donor" },
};

const DONATION_TYPE_ICONS: Record<
  Donation["donationType"],
  { icon: typeof Banknote; label: string }
> = {
  one_time: { icon: Banknote, label: "One-time donation" },
  recurring: { icon: Repeat, label: "Recurring donation" },
  pledge: { icon: Handshake, label: "Pledge" },
};

export function DonationsTable({
  donations,
  total,
  totalPages,
  loading,
  error,
  onViewDetails,
  onEdit,
  onUpdateStatus,
  onRefresh,
  tableState,
}: DonationsTableProps) {
  const columns = useMemo<ColumnDef<Donation>[]>(
    () => [
      {
        id: "donorName",
        accessorKey: "donorName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Donor" className="justify-start" />
        ),
        cell: ({ row }) => {
          const donorType = DONOR_TYPE_ICONS[row.original.donorType];
          const DonorIcon = donorType?.icon ?? User;
          return (
            <div className="flex items-center gap-2">
              <DonorIcon
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-label={donorType?.label ?? "Donor"}
              />
              <div className="min-w-0">
                <div className="font-medium">{row.original.donorName}</div>
                <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {row.original.donorEmail}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "donationType",
        accessorKey: "donationType",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const donationType = DONATION_TYPE_ICONS[row.original.donationType];
          const TypeIcon = donationType?.icon ?? Banknote;
          return (
            <div className="flex items-center gap-1">
              <TypeIcon
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-label={donationType?.label ?? "Donation type"}
              />
              <span className="text-sm capitalize">
                {row.original.donationType.replace("_", " ")}
              </span>
            </div>
          );
        },
      },
      {
        id: "campaign",
        accessorFn: (row) => row.campaign ?? "General",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
        cell: ({ row }) => <span className="text-sm">{row.original.campaign || "General"}</span>,
      },
      {
        id: "amount",
        accessorFn: (row) => row.amount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        id: "donationDate",
        accessorFn: (row) => new Date(row.donationDate).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => {
          const date = new Date(row.original.donationDate);
          return (
            <div className="space-y-0.5" title={formatDistanceToNow(date, { addSuffix: true })}>
              <span className="tabular-nums">{format(date, "MMM d, yyyy")}</span>
              <span className="block text-xs text-muted-foreground">
                {formatDistanceToNow(date, { addSuffix: true })}
              </span>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const badge = STATUS_BADGES[row.original.status];
          const StatusIcon = badge?.icon ?? Clock;
          return (
            <Badge variant={badge?.variant ?? "outline"} className="gap-1 w-fit">
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {row.original.status}
            </Badge>
          );
        },
      },
      {
        id: "receipt",
        enableSorting: false,
        accessorFn: (row) => (row.receiptSent ? "sent" : "pending"),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Receipt" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.receiptSent ? (
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" aria-hidden="true" />
            )}
            <span className="text-sm">{row.original.receiptSent ? "Sent" : "Pending"}</span>
          </div>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Actions for donation by ${row.original.donorName}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewDetails?.(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Donation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                {row.original.status !== "completed" && (
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(row.original.id, "completed")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </DropdownMenuItem>
                )}
                {row.original.status !== "pending" && (
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(row.original.id, "pending")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Mark as Pending
                  </DropdownMenuItem>
                )}
                {row.original.status !== "failed" && (
                  <DropdownMenuItem onClick={() => onUpdateStatus?.(row.original.id, "failed")}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Failed
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onViewDetails, onEdit, onUpdateStatus],
  );

  return (
    /*
     * The list endpoint takes only status/page/limit — no search or sort
     * params — so the `?q=` search and the column sort toggles apply
     * client-side to the loaded page (stated, not silent). Pagination
     * stays server-driven via the list meta.
     */
    <DataTable
      columns={columns}
      data={donations}
      loading={loading}
      error={error}
      onRetry={onRefresh}
      getRowId={(row) => row.id}
      onRowClick={(donation) => onViewDetails?.(donation)}
      sorting={tableState.state.sorting}
      onSortingChange={(updater) =>
        tableState.setSorting(
          typeof updater === "function" ? updater(tableState.state.sorting) : updater,
        )
      }
      globalFilter={tableState.state.globalFilter}
      onGlobalFilterChange={(updater) =>
        tableState.setGlobalFilter(
          typeof updater === "function" ? updater(tableState.state.globalFilter) : updater,
        )
      }
      columnFilters={tableState.state.columnFilters}
      onColumnFiltersChange={(updater) =>
        tableState.setColumnFilters(
          typeof updater === "function" ? updater(tableState.state.columnFilters) : updater,
        )
      }
      caption="Donations"
      emptyTitle="No donations found"
      emptyDescription="Adjust the search or record the first donation."
      emptyIcon={<HandHeart className="h-8 w-8" />}
      toolbar={(table) => (
        <>
          <DataTableSearch
            value={tableState.state.globalFilter}
            onValueChange={tableState.setGlobalFilter}
            placeholder="Search donations…"
          />
          <DataTableViewOptions table={table} />
        </>
      )}
      pagination={
        <DataTablePagination
          page={tableState.state.page}
          pageCount={totalPages}
          total={total}
          pageSize={tableState.state.pageSize}
          loading={loading}
          onPageChange={tableState.setPage}
          onPageSizeChange={tableState.setPageSize}
        />
      }
    />
  );
}
