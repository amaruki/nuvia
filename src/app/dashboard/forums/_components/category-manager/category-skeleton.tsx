import { Card, CardContent } from "@/components/ui/card";

export function CategorySkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse border-l-4 border-l-muted">
          <CardContent className="p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="size-16 rounded-full bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted/50 rounded" />
                <div className="h-4 w-24 bg-muted/30 rounded" />
                <div className="h-4 w-28 bg-muted/30 rounded" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted/30 rounded" />
              <div className="h-4 w-full bg-muted/30 rounded" />
              <div className="h-4 w-3/4 bg-muted/30 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
