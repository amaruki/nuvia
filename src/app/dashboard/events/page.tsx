"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { EventList } from "@/components/events";

export default function AdminEventsPage() {
  const router = useRouter();
  const { user, isPending } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You must be logged in to access event management.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">
            Create and manage events, track registrations, and view analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/events/analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => router.push("/dashboard/events/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* EventList fetches real rows from GET /api/v1/events (events:read)
          through the useEvents hook — backlog B2. */}
      <EventList showCreateButton={false} showRegistrationStatus={false} />
    </div>
  );
}
