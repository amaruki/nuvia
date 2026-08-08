import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import type { SearchFilterCardProps } from "./types";
import { AddPermissionDialog } from "./add-permission-dialog";

export function SearchFilterCard({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  isAddDialogOpen,
  onAddDialogOpenChange,
  onAddPermission,
}: SearchFilterCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search & Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={onFilterChange}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="role">Roles</SelectItem>
              <SelectItem value="chapter">Chapters</SelectItem>
              <SelectItem value="committee">Committees</SelectItem>
            </SelectContent>
          </Select>

          <AddPermissionDialog
            open={isAddDialogOpen}
            onOpenChange={onAddDialogOpenChange}
            onAdd={onAddPermission}
          />
        </div>
      </CardContent>
    </Card>
  );
}
