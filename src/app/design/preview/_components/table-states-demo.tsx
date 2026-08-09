"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/data-table";

interface InvoiceRow {
  id: string;
  member: string;
  amount: string;
  due: string;
}

export function TableStatesDemo() {
  const columns = useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      { accessorKey: "member", header: "Member" },
      { accessorKey: "amount", header: "Amount" },
      { accessorKey: "due", header: "Due date" },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Loading</h3>
          <DataTable
            columns={columns}
            data={[]}
            loading
            skeletonRows={4}
            caption="Invoices, loading state"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Error with retry</h3>
          <DataTable
            columns={columns}
            data={[]}
            error="500: could not reach the database. The request has been logged."
            onRetry={() => toast("Retry clicked (demo)")}
            caption="Invoices, error state"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Empty with next action</h3>
          <DataTable
            columns={columns}
            data={[]}
            emptyTitle="No invoices yet"
            emptyDescription="Invoices appear here once a membership tier is published."
            emptyAction={
              <Button size="sm" onClick={() => toast("Create invoice clicked (demo)")}>
                Create invoice
              </Button>
            }
            caption="Invoices, empty state"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Feedback: toasts (sonner, UI-14)</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Changes saved")}>
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.error("Could not save changes")}
            >
              Error
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Member invite sent")}>
              Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.warning("Certificate expires in 7 days")}
            >
              Warning
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Every mutation in the app reports through toasts: one outcome per action, no stacked
            confirmations. The Toaster lives once in the root layout.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">EmptyState variants</h3>
          <div className="grid gap-3">
            <div className="rounded-md border">
              <EmptyState title="No results" />
            </div>
            <div className="rounded-md border">
              <EmptyState
                icon={<SearchX aria-hidden="true" className="text-muted-foreground size-8" />}
                title="No events match your filters"
                description="Try a wider date range, or clear the chapter filter."
              />
            </div>
            <div className="rounded-md border">
              <EmptyState
                icon={<CalendarDays aria-hidden="true" className="text-primary size-8" />}
                title="No upcoming events"
                description="Published events appear here automatically."
                actions={
                  <Button size="sm" onClick={() => toast("Create event clicked (demo)")}>
                    Create event
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
