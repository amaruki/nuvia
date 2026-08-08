import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import type { UserFilterSearchBarProps } from "./types";

export default function UserFilterSearchBar({ value, onChange }: UserFilterSearchBarProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="search" className="text-sm font-medium">
        Search Users
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          id="search"
          placeholder="Search by name, email, or username..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
