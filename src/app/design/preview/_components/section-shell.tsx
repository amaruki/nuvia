import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

interface SectionShellProps {
  id: string;
  index: number;
  title: string;
  description: string;
  /** Production pages that will consume this pattern. */
  consumers: string[];
  children: ReactNode;
}

/**
 * Numbered section wrapper for the design preview: one heading pattern, one
 * place to state which production pages consume each pattern.
 */
export function SectionShell({
  id,
  index,
  title,
  description,
  consumers,
  children,
}: SectionShellProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums"
          >
            {index}
          </span>
          <h2 id={`${id}-heading`} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">{description}</p>
        <p className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-muted-foreground text-xs font-medium">Used by:</span>
          {consumers.map((consumer) => (
            <Badge key={consumer} variant="outline" className="text-xs font-normal">
              {consumer}
            </Badge>
          ))}
        </p>
      </div>
      {children}
    </section>
  );
}
