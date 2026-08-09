"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableSearchProps {
  /** Controlled value (usually from URL search params). */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Debounced search input for table filtering. The page decides whether the
 * value feeds a client-side globalFilter or a server query param.
 */
export function DataTableSearch({
  value,
  onValueChange,
  placeholder = "Search...",
  className,
  id = "data-table-search",
}: DataTableSearchProps) {
  const [draft, setDraft] = useState(value);
  const deferred = useDeferredValue(draft);

  useEffect(() => {
    if (deferred !== value) {
      onValueChange(deferred);
    }
  }, [deferred, value, onValueChange]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search
        className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}
