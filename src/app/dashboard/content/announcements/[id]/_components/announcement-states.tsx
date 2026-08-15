import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AnnouncementLoading() {
  return (
    <div className="max-w-5xl">
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

interface AnnouncementErrorProps {
  error: string;
  onBack: () => void;
}

export function AnnouncementError({ error, onBack }: AnnouncementErrorProps) {
  return (
    <div className="max-w-5xl text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}

interface AnnouncementNotFoundProps {
  onBack: () => void;
}

export function AnnouncementNotFound({ onBack }: AnnouncementNotFoundProps) {
  return (
    <div className="max-w-5xl text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Announcement not found</h2>
        <p className="text-muted-foreground">
          The announcement you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
