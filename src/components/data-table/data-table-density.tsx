"use client";

import { useEffect, useState } from "react";
import { Rows3, Rows4 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Row density (UI-09 convention 5): comfortable default, compact for power users. */
export type DataTableDensity = "comfortable" | "compact";

/** localStorage key the toggle persists the user's choice under. */
export const TABLE_DENSITY_STORAGE_KEY = "nuvia:table-density";

const DENSITY_OPTIONS = [
  { value: "comfortable", label: "Comfortable rows", Icon: Rows3 },
  { value: "compact", label: "Compact rows", Icon: Rows4 },
] as const satisfies { value: DataTableDensity; label: string; Icon: typeof Rows3 }[];

function isDataTableDensity(value: string | null): value is DataTableDensity {
  return value === "comfortable" || value === "compact";
}

export interface DataTableDensityToggleProps {
  /** Controlled density; falls back to the stored value, then "comfortable". */
  density?: DataTableDensity;
  /** Fired after the user picks a density so the page can feed it to `<DataTable />`. */
  onDensityChange?: (density: DataTableDensity) => void;
  className?: string;
}

/**
 * Comfortable/compact switch (UI-09 convention 5). The choice persists in
 * localStorage under `nuvia:table-density` and is reported through
 * `onDensityChange`; the owning page passes it back as the table's `density`
 * prop. Storage is only read inside an effect, so SSR renders the
 * "comfortable" default and never mismatches the client's first paint.
 */
export function DataTableDensityToggle({
  density,
  onDensityChange,
  className,
}: DataTableDensityToggleProps) {
  const [storedDensity, setStoredDensity] = useState<DataTableDensity | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY);
      if (isDataTableDensity(stored)) {
        setStoredDensity(stored);
      }
    } catch {
      // Storage unavailable (private mode, blocked cookies): stay on defaults.
    }
  }, []);

  const active = density ?? storedDensity ?? "comfortable";

  function select(next: DataTableDensity) {
    if (next === active) {
      return;
    }
    setStoredDensity(next);
    try {
      window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, next);
    } catch {
      // Keep the in-memory choice even when persisting is impossible.
    }
    onDensityChange?.(next);
  }

  return (
    <div
      role="group"
      aria-label="Table density"
      className={cn(
        "bg-muted/40 inline-flex h-8 items-center gap-0.5 rounded-md border p-0.5",
        className,
      )}
    >
      {DENSITY_OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={active === value}
          aria-label={label}
          onClick={() => select(value)}
          className={cn(
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-6 items-center justify-center rounded-[4px] transition-colors",
            active === value && "bg-background text-foreground shadow-xs",
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
