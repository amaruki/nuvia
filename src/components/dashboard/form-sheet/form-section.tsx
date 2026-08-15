import * as React from "react";

import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Groups related fields inside a FormSheet body with a small heading. Use
 * one FormSection per logical group ("Basic info", "Access", ...); single
 * group forms can omit it. The sheet title is the dialog heading, so
 * sections use h3 to keep the outline intact.
 */
export function FormSection({ title, description, className, children }: FormSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
