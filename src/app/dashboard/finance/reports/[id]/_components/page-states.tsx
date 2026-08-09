import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ReportLoadingState() {
  return (
    <div className="space-y-6">
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-48 mb-2"></div>
          <div className="h-3 bg-muted rounded w-96 max-w-full"></div>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted rounded"></div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ReportErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ReportErrorState({ error, onRetry }: ReportErrorStateProps) {
  return (
    <div className="space-y-6">
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  );
}

export function ReportNotFoundState() {
  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/dashboard/finance/reports">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to reports
        </Link>
      </Button>
      <Alert>
        <AlertDescription>
          No report with this identifier exists. Reports are computed live — see the reports list
          for what is available.
        </AlertDescription>
      </Alert>
    </div>
  );
}
