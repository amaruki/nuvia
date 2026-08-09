import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { ActiveFiltersSummaryProps } from "./types";

export function ActiveFiltersSummary({ filters }: ActiveFiltersSummaryProps) {
  return (
    <div className="space-y-2">
      <Label>Active Filters</Label>
      <div className="flex flex-wrap gap-2">
        {filters.status?.map((status) => (
          <Badge key={status} variant="secondary" className="text-xs">
            Status: {status}
          </Badge>
        ))}
        {filters.donorType?.map((type) => (
          <Badge key={type} variant="secondary" className="text-xs">
            Donor: {type}
          </Badge>
        ))}
        {filters.donationType?.map((type) => (
          <Badge key={type} variant="secondary" className="text-xs">
            Type: {type}
          </Badge>
        ))}
        {filters.campaign?.map((campaign) => (
          <Badge key={campaign} variant="secondary" className="text-xs">
            Campaign: {campaign}
          </Badge>
        ))}
        {filters.dateRange && (
          <Badge variant="secondary" className="text-xs">
            Date Range
          </Badge>
        )}
        {filters.amountRange && (
          <Badge variant="secondary" className="text-xs">
            Amount Range
          </Badge>
        )}
        {filters.search && (
          <Badge variant="secondary" className="text-xs">
            Search: {filters.search}
          </Badge>
        )}
      </div>
    </div>
  );
}
