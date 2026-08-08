import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicationLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
        <div className="h-32 bg-muted rounded mb-4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    </div>
  );
}

interface PublicationErrorProps {
  error: string;
  onBack: () => void;
}

export function PublicationError({ error, onBack }: PublicationErrorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );
}
