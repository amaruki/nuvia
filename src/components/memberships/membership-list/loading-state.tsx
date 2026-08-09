import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListLoadingStateProps {
  className?: string;
}

export default function ListLoadingState({ className }: ListLoadingStateProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Loading Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Member Directory</h2>
              <LoadingSkeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
          <LoadingSkeleton className="h-10 w-32" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <LoadingSkeleton className="h-10 w-48" />
          <LoadingSkeleton className="h-10 w-24" />
          <LoadingSkeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Loading Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border-l-4 border-l-muted">
            <CardContent className="p-5">
              <div className="flex items-start gap-4 mb-5">
                <LoadingSkeleton className="size-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <LoadingSkeleton className="h-5 w-32" />
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="h-4 w-28" />
                </div>
              </div>
              <div className="space-y-3">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
