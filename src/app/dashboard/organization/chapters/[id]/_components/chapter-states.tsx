import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export function ChapterLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-64 mb-4"></div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-48"></div>
              <div className="h-3 bg-muted rounded w-40"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ChapterErrorProps {
  error: string;
  onBack: () => void;
  onRetry: () => void;
}

export function ChapterError({ error, onBack, onRetry }: ChapterErrorProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chapters
        </Button>
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

interface ChapterNotFoundProps {
  onBack: () => void;
}

export function ChapterNotFound({ onBack }: ChapterNotFoundProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chapters
        </Button>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Chapter not found</AlertDescription>
      </Alert>
    </div>
  );
}
