import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";

export function CommitteeLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-4"></div>
        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    </div>
  );
}

interface CommitteeNotFoundProps {
  onBack: () => void;
}

export function CommitteeNotFound({ onBack }: CommitteeNotFoundProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">Committee Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The committee you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
