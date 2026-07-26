/**
 * Component for handling loading and error states in async content
 */

import * as React from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AsyncContentProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export function AsyncContent({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  onRetry,
  className = "",
}: AsyncContentProps) {
  if (isLoading) {
    return (
      loadingComponent || (
        <div className={`flex justify-center items-center py-12 ${className}`}>
          <LoadingSpinner size="lg" />
        </div>
      )
    );
  }

  if (error) {
    return (
      errorComponent || (
        <div className={`py-8 ${className}`}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col items-start gap-4">
              <span>{error}</span>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
}

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

interface AsyncBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AsyncBoundary extends React.Component<AsyncBoundaryProps, AsyncBoundaryState> {
  constructor(props: AsyncBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AsyncBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AsyncBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.errorFallback || (
          <div className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {this.state.error?.message || "Something went wrong"}
              </AlertDescription>
            </Alert>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export { AsyncBoundary };
