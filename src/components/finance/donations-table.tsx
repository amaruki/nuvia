"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  HandHeart,
  Handshake,
  Mail,
  MoreHorizontal,
  Repeat,
  User,
  XCircle,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  DataTableViewOptions,
} from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
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

interface DonationsTableProps {
  donations: Donation[];
  onViewDetails?: (donation: Donation) => void;
  onRecordPayment?: (donationId: string, amount: number, paymentMethod: string) => void;
  onSendReceipt?: (donationId: string) => void;
  onUpdateStatus?: (donationId: string, status: Donation["status"]) => void;
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
  anonymous: { icon: EyeOff, label: "Anonymous donor" },
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
  onViewDetails,
  onRecordPayment,
  onSendReceipt,
  onUpdateStatus,
}: DonationsTableProps) {
  const tableState = useDataTableState({ defaultPageSize: 20 });
  const { page, pageSize, globalFilter, sorting } = tableState.state;

  // Client-mode table: filter and sort in memory, then slice the page.
  const filtered = useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    const searched = query
      ? donations.filter(
          (donation) =>
            donation.donorName.toLowerCase().includes(query) ||
            donation.donorEmail.toLowerCase().includes(query) ||
            (donation.campaign ?? "").toLowerCase().includes(query),
        )
      : donations;

    const [{ id, desc } = { id: "donationDate", desc: true }] = sorting;
    const sorted = [...searched].sort((a, b) => {
      const valueOf = (donation: Donation): number | string => {
        switch (id) {
          case "donorName":
            return donation.donorName.toLowerCase();
          case "campaign":
            return (donation.campaign ?? "").toLowerCase();
          case "amount":
            return donation.amount;
          case "status":
            return donation.status;
          default:
            return new Date(donation.donationDate).getTime();
        }
      };
      const left = valueOf(a);
      const right = valueOf(b);
      const compared = left < right ? -1 : left > right ? 1 : 0;
      return desc ? -compared : compared;
    });

    return sorted;
  }, [donations, globalFilter, sorting]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

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
                <DropdownMenuSeparator />
                {row.original.status !== "completed" && (
                  <DropdownMenuItem
                    onClick={() =>
                      onRecordPayment?.(row.original.id, row.original.amount, "Credit Card")
                    }
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </DropdownMenuItem>
                )}
                {!row.original.receiptSent && (
                  <DropdownMenuItem onClick={() => onSendReceipt?.(row.original.id)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Receipt
                  </DropdownMenuItem>
                )}
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
    [onViewDetails, onRecordPayment, onSendReceipt, onUpdateStatus],
  );

  return (
    <DataTable
      columns={columns}
      data={pageRows}
      getRowId={(row) => row.id}
      manualSorting
      sorting={tableState.state.sorting}
      onSortingChange={(updater) =>
        tableState.setSorting(
          typeof updater === "function" ? updater(tableState.state.sorting) : updater,
        )
      }
      manualFiltering
      globalFilter={tableState.state.globalFilter}
      onGlobalFilterChange={(updater) =>
        tableState.setGlobalFilter(
          typeof updater === "function" ? updater(tableState.state.globalFilter) : updater,
        )
      }
      caption="Donations"
      emptyTitle="No donations found"
      emptyDescription="Adjust the search or record the first donation."
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
          page={clampedPage}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={tableState.setPage}
          onPageSizeChange={tableState.setPageSize}
        />
      }
    />
  );
}
