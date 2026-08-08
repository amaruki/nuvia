import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AnnouncementLoading() {
  return (
    <div className="container max-w-5xl py-6 mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-64 bg-muted rounded"></div>
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
    <div className="container max-w-5xl py-6 mx-auto text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
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
    <div className="container max-w-5xl py-6 mx-auto text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Announcement not found</h1>
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
