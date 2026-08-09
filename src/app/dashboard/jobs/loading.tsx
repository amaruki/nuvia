import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Loading placeholder for the dashboard job management list (UI-20).
 * Mirrors the stats cards, search input and the postings table.
 */
export default function DashboardJobsLoading() {
  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="px-6 pb-6 space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-9 w-full max-w-sm" />

      {/* Postings table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">
                <Skeleton className="h-3 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-14" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-3 w-16 ml-auto" />
              </TableHead>
              <TableHead className="text-right">
                <Skeleton className="h-3 w-12 ml-auto" />
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-8 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
