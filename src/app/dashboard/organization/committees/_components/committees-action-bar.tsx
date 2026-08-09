import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

interface CommitteesActionBarProps {
  totalCount: number;
  activeCount?: number;
  onRefresh: () => void;
  onAdd: () => void;
}

export function CommitteesActionBar({
  totalCount,
  activeCount,
  onRefresh,
  onAdd,
}: CommitteesActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Badge variant="outline" className="text-sm">
          {totalCount} committees total
        </Badge>
        {activeCount !== undefined && (
          <Badge variant="secondary" className="text-sm">
            {activeCount} active
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} className="flex-1 sm:flex-none">
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Committee</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </div>
  );
}
