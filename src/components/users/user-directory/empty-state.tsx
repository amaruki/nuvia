import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, X } from "lucide-react";
import type { UserDirectoryEmptyStateProps } from "./types";

export default function UserDirectoryEmptyState({
  activeFiltersCount,
  onClearFilters,
}: UserDirectoryEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-12">
        <EmptyState
          icon={
            <div className="flex items-center justify-center size-16 rounded-full bg-muted/50 mb-4">
              <Users className="size-8 text-muted-foreground" />
            </div>
          }
          title="No users found"
          description={
            activeFiltersCount > 0
              ? "No users match your current filters. Try adjusting your search criteria."
              : "The user directory is currently empty. Check back later for updates."
          }
          actions={
            activeFiltersCount > 0 && onClearFilters ? (
              <Button variant="outline" onClick={onClearFilters} className="gap-2">
                <X className="size-4" />
                Clear All Filters
              </Button>
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
