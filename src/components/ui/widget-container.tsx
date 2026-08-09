import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { LoadingSpinner } from "./loading-spinner";
import { EmptyState } from "./empty-state";
import { WidgetType } from "@/types/dashboard.types";

interface WidgetContainerProps {
  type: WidgetType;
  title: string;
  description?: string;
  size?: "small" | "medium" | "large" | "wide";
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

const sizeClasses = {
  small: "col-span-1",
  medium: "col-span-1 md:col-span-2",
  large: "col-span-1 md:col-span-2 lg:col-span-3",
  wide: "col-span-1 md:col-span-2 lg:col-span-4",
};

export function WidgetContainer({
  type,
  title,
  description,
  size = "medium",
  children,
  className,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
}: WidgetContainerProps) {
  return (
    <div className={cn(sizeClasses[size], className)}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="md" />
            </div>
          ) : empty ? (
            <EmptyState title={emptyMessage} className="h-32 justify-center p-0" />
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}
