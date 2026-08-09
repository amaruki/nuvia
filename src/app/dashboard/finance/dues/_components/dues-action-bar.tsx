import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DuesActionBarProps {
  /** Total dues across all pages (from the report meta, not one page). */
  totalDues: number;
  overdueCount?: number;
  onRefresh: () => void;
}

export function DuesActionBar({ totalDues, overdueCount, onRefresh }: DuesActionBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm">
          {totalDues} dues total
        </Badge>
        {overdueCount !== undefined && (
          <Badge variant="secondary" className="text-sm">
            {overdueCount} overdue
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
