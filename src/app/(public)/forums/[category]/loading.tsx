import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the category thread list. */
export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-9 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border rounded-lg bg-card p-5 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
