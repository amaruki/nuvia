import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";
import FilterSection from "./filter-section";
import type { UserFilterLocationSectionProps } from "./types";

export default function UserFilterLocationSection({
  locations,
  onAdd,
  onRemove,
}: UserFilterLocationSectionProps) {
  return (
    <FilterSection title="Location" icon={<MapPin className="size-4" />}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Add location..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              onAdd(input.value);
              input.value = "";
            }}
          >
            Add
          </Button>
        </div>

        {locations && locations.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {locations.map((location, index) => (
              <Badge key={index} variant="secondary" className="gap-1 pr-1">
                {location}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(location)}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="size-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </FilterSection>
  );
}
