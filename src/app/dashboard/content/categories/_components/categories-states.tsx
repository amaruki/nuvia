import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-8 bg-muted rounded w-32 mb-2"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CategoriesErrorProps {
  error: string;
  onRetry: () => void;
}

export function CategoriesError({ error, onRetry }: CategoriesErrorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );
}
