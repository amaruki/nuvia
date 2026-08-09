"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
  Star,
  TestTube,
  Trash2,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { PaymentGateway } from "@/types/finance";

interface GatewaysTableProps {
  gateways: PaymentGateway[];
  onViewDetails: (gateway: PaymentGateway) => void;
  onEdit: (gateway: PaymentGateway) => void;
  onDelete: (gateway: PaymentGateway) => void;
  onToggleStatus: (gateway: PaymentGateway, enabled: boolean) => void;
  onTest: (gateway: PaymentGateway) => Promise<void> | void;
  onSetDefault: (gateway: PaymentGateway) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  active: CheckCircle,
  inactive: XCircle,
  testing: Clock,
  error: AlertTriangle,
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  testing: "outline",
  error: "destructive",
};

export function GatewaysTable({
  gateways,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  onTest,
  onSetDefault,
}: GatewaysTableProps) {
  const [testingGateway, setTestingGateway] = useState<string | null>(null);
  const tableState = useDataTableState({ defaultPageSize: 20 });
  const { page, pageSize, globalFilter, sorting } = tableState.state;

  const handleTest = useCallback(
    async (gateway: PaymentGateway) => {
      setTestingGateway(gateway.id);
      try {
        await onTest(gateway);
      } finally {
        setTestingGateway(null);
      }
    },
    [onTest],
  );

  // Client-mode table: filter and sort in memory, then slice the page.
  const filtered = useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    const searched = query
      ? gateways.filter(
          (gateway) =>
            gateway.displayName.toLowerCase().includes(query) ||
            gateway.provider.toLowerCase().includes(query),
        )
      : gateways;

    const [{ id, desc } = { id: "displayName", desc: false }] = sorting;
    const sorted = [...searched].sort((a, b) => {
      const valueOf = (gateway: PaymentGateway): number | string => {
        switch (id) {
          case "provider":
            return gateway.provider.toLowerCase();
          case "status":
            return gateway.status;
          case "totalTransactions":
            return gateway.statistics.totalTransactions;
          case "totalVolume":
            return gateway.statistics.totalVolume;
          case "successRate":
            return gateway.statistics.successRate;
          default:
            return gateway.displayName.toLowerCase();
        }
      };
      const left = valueOf(a);
      const right = valueOf(b);
      const compared = left < right ? -1 : left > right ? 1 : 0;
      return desc ? -compared : compared;
    });

    return sorted;
  }, [gateways, globalFilter, sorting]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  const columns = useMemo<ColumnDef<PaymentGateway>[]>(
    () => [
      {
        id: "displayName",
        accessorKey: "displayName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Gateway" className="justify-start" />
        ),
        cell: ({ row }) => {
          const StatusIcon = STATUS_ICONS[row.original.status] ?? Clock;
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <StatusIcon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{row.original.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {row.original.currencies.join(", ")}
                </div>
              </div>
              {row.original.isDefault && (
                <Star className="h-4 w-4 text-yellow-500" aria-label="Default gateway" />
              )}
            </div>
          );
        },
      },
      {
        id: "provider",
        accessorKey: "provider",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.provider}
          </Badge>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[row.original.status] ?? "secondary"}>
              {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
            </Badge>
            {row.original.lastTestedAt && (
              <span
                className="text-xs text-muted-foreground"
                title={format(new Date(row.original.lastTestedAt), "MMM d, yyyy HH:mm")}
              >
                Tested{" "}
                {formatDistanceToNow(new Date(row.original.lastTestedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "environment",
        accessorKey: "environment",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Environment" />,
        cell: ({ row }) => (
          <Badge variant={row.original.environment === "production" ? "default" : "outline"}>
            {row.original.environment === "production" ? "Prod" : "Sandbox"}
          </Badge>
        ),
      },
      {
        id: "totalTransactions",
        accessorFn: (row) => row.statistics.totalTransactions,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Transactions" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-medium tabular-nums">
              {row.original.statistics.totalTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground tabular-nums">
              {row.original.statistics.monthlyTransactions[0]?.count || 0} this month
            </div>
          </div>
        ),
      },
      {
        id: "totalVolume",
        accessorFn: (row) => row.statistics.totalVolume,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Volume" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-medium tabular-nums">
              {formatCurrency(row.original.statistics.totalVolume)}
            </div>
            <div className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(row.original.statistics.monthlyTransactions[0]?.volume || 0)} this
              month
            </div>
          </div>
        ),
      },
      {
        id: "successRate",
        accessorFn: (row) => row.statistics.successRate,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Success Rate" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <span
              className={`font-medium tabular-nums ${
                row.original.statistics.successRate >= 95
                  ? "text-green-600"
                  : row.original.statistics.successRate >= 90
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {row.original.statistics.successRate.toFixed(1)}%
            </span>
            {row.original.statistics.errorRates.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            )}
          </div>
        ),
      },
      {
        id: "enabled",
        enableSorting: false,
        accessorFn: (row) => (row.isEnabled ? "enabled" : "disabled"),
        header: "Enabled",
        cell: ({ row }) => (
          <Switch
            checked={row.original.isEnabled}
            onCheckedChange={(checked) => onToggleStatus(row.original, checked)}
            disabled={row.original.status === "testing"}
            aria-label={`Toggle ${row.original.displayName}`}
          />
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
                  aria-label={`Actions for ${row.original.displayName} gateway`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTest(row.original)}
                  disabled={testingGateway === row.original.id}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  {testingGateway === row.original.id ? "Testing..." : "Test Connection"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!row.original.isDefault && (
                  <DropdownMenuItem onClick={() => onSetDefault(row.original)}>
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onToggleStatus(row.original, !row.original.isEnabled)}
                >
                  {row.original.isEnabled ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Enable
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(row.original)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onViewDetails, onEdit, onDelete, onToggleStatus, onSetDefault, testingGateway, handleTest],
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
      caption="Payment gateways"
      emptyTitle="No gateways configured"
      emptyDescription="Add a payment gateway to start accepting payments."
      toolbar={(table) => (
        <>
          <DataTableSearch
            value={tableState.state.globalFilter}
            onValueChange={tableState.setGlobalFilter}
            placeholder="Search gateways…"
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
