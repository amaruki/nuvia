import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSort } from "@/types/user-management.types";

interface SortableHeaderProps {
  children: React.ReactNode;
  field: UserSort["field"];
  currentSort: UserSort;
  onSort: (sort: UserSort) => void;
  className?: string;
}

export default function SortableHeader({
  children,
  field,
  currentSort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isCurrentField = currentSort.field === field;
  const direction = isCurrentField ? currentSort.direction : "asc";

  const handleSort = () => {
    onSort({
      field,
      direction: isCurrentField && direction === "asc" ? "desc" : "asc",
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8 data-[state=open]:bg-accent", className)}
      onClick={handleSort}
      aria-label={`Sort by ${field}`}
      aria-sort={isCurrentField ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{children}</span>
      {isCurrentField ? (
        direction === "asc" ? (
          <ArrowUp className="ml-2 size-4" />
        ) : (
          <ArrowDown className="ml-2 size-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 size-4" />
      )}
    </Button>
  );
}
