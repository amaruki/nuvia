import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type MembershipFilter, MembershipStatus, MembershipTier } from "@/types/membership.types";
import { MEMBERSHIP_STATUSES, MEMBERSHIP_TIERS } from "./constants";

interface FilterDialogProps {
  filters: MembershipFilter;
  onFiltersChange: (filters: MembershipFilter) => void;
  isLoading?: boolean;
  activeFiltersCount: number;
  onClearAll: () => void;
  onDone: () => void;
}

export default function FilterDialog({
  filters,
  onFiltersChange,
  isLoading,
  activeFiltersCount,
  onClearAll,
  onDone,
}: FilterDialogProps) {
  const handleTierChange = (tier: MembershipTier, checked: boolean) => {
    const currentTiers = filters.tiers || [];
    const newTiers = checked ? [...currentTiers, tier] : currentTiers.filter((t) => t !== tier);

    onFiltersChange({
      ...filters,
      tiers: newTiers.length > 0 ? newTiers : undefined,
    });
  };

  const handleStatusChange = (status: MembershipStatus, checked: boolean) => {
    const currentStatuses = filters.statuses || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s) => s !== status);

    onFiltersChange({
      ...filters,
      statuses: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader className="pb-4">
        <div className="flex items-center justify-between">
          <DialogTitle>Filter Members</DialogTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={isLoading}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="size-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </DialogHeader>

      {/* Simple Filter Content */}
      <div className="space-y-4 py-2">
        {/* Membership Tier */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Membership Tier</Label>
          <div className="flex flex-wrap gap-2">
            {MEMBERSHIP_TIERS.map((tier) => (
              <Badge
                key={tier.value}
                variant={filters.tiers?.includes(tier.value) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleTierChange(tier.value, !filters.tiers?.includes(tier.value))}
              >
                {tier.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex flex-wrap gap-2">
            {MEMBERSHIP_STATUSES.map((status) => (
              <Badge
                key={status.value}
                variant={filters.statuses?.includes(status.value) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() =>
                  handleStatusChange(status.value, !filters.statuses?.includes(status.value))
                }
              >
                {status.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Date Range - Simple */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Join Date</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={
                filters.startDateRange?.from
                  ? new Date(filters.startDateRange.from).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const fromDate = e.target.value ? new Date(e.target.value) : undefined;
                onFiltersChange({
                  ...filters,
                  startDateRange:
                    fromDate && filters.startDateRange?.to
                      ? { from: fromDate, to: filters.startDateRange.to }
                      : fromDate
                        ? { from: fromDate, to: new Date() }
                        : undefined,
                });
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Input
              type="date"
              placeholder="To"
              value={
                filters.startDateRange?.to
                  ? new Date(filters.startDateRange.to).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const toDate = e.target.value ? new Date(e.target.value) : undefined;
                onFiltersChange({
                  ...filters,
                  startDateRange:
                    toDate && filters.startDateRange?.from
                      ? { from: filters.startDateRange.from, to: toDate }
                      : toDate && filters.startDateRange?.from
                        ? { from: filters.startDateRange.from, to: toDate }
                        : undefined,
                });
              }}
              disabled={isLoading}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button onClick={onDone} disabled={isLoading} className="w-full">
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
