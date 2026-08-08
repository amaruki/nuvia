import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserSort } from "@/types/user-management.types";
import SortableHeader from "./sortable-header";

interface UserTableHeadProps {
  showSelection: boolean;
  allSelected: boolean;
  someSelected: boolean;
  sort: UserSort;
  onSort: (sort: UserSort) => void;
  onSelectAll: (checked: boolean) => void;
}

export default function UserTableHead({
  showSelection,
  allSelected,
  someSelected,
  sort,
  onSort,
  onSelectAll,
}: UserTableHeadProps) {
  return (
    <TableHeader>
      <TableRow className="border-b bg-muted/30">
        {showSelection && (
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              ref={(node: HTMLButtonElement | null) => {
                if (node) {
                  // Radix Checkbox renders a <button>; `indeterminate` is an expando, not a DOM property.
                  (node as HTMLButtonElement & { indeterminate?: boolean }).indeterminate =
                    someSelected;
                }
              }}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              aria-label="Select all users"
            />
          </TableHead>
        )}
        <TableHead className="w-[300px]">
          <SortableHeader field="name" currentSort={sort} onSort={onSort}>
            User
          </SortableHeader>
        </TableHead>
        <TableHead className="w-[120px]">
          <SortableHeader field="userRole" currentSort={sort} onSort={onSort}>
            Role
          </SortableHeader>
        </TableHead>
        <TableHead className="w-[120px]">
          <SortableHeader field="status" currentSort={sort} onSort={onSort}>
            Status
          </SortableHeader>
        </TableHead>
        <TableHead className="w-[150px]">Contact</TableHead>
        <TableHead className="w-[120px]">Location</TableHead>
        <TableHead className="w-[150px]">
          <SortableHeader field="lastLoginAt" currentSort={sort} onSort={onSort}>
            Last Login
          </SortableHeader>
        </TableHead>
        <TableHead className="w-[120px]">
          <SortableHeader field="createdAt" currentSort={sort} onSort={onSort}>
            Joined
          </SortableHeader>
        </TableHead>
        <TableHead className="w-12">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
