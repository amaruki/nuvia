import { Skeleton } from "@/components/ui/skeleton";

export function ArticleLoadingState() {
  return (
    <div className="container max-w-5xl py-6 mx-auto">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

interface ArticleErrorStateProps {
  error: string;
  onBack: () => void;
}

export function ArticleErrorState({ error, onBack }: ArticleErrorStateProps) {
  return (
    <div className="container max-w-5xl py-6 mx-auto text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

interface ArticleNotFoundStateProps {
  onBack: () => void;
}

export function ArticleNotFoundState({ onBack }: ArticleNotFoundStateProps) {
  return (
    <div className="container max-w-5xl py-6 mx-auto text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="text-muted-foreground">The article you're looking for doesn't exist.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
