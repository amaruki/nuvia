import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Loader2, Shield, Trash2 } from "lucide-react";

import { SessionRow } from "./session-row";
import type { SessionData } from "./types";

interface OtherSessionsCardProps {
  sessions: SessionData[];
  isRevoking: boolean;
  selectedSessionId: string | null;
  onRevokeAll: () => void;
  onRevokeSession: (sessionId: string) => void;
}

export function OtherSessionsCard({
  sessions,
  isRevoking,
  selectedSessionId,
  onRevokeAll,
  onRevokeSession,
}: OtherSessionsCardProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Other Active Sessions</h3>
          <p className="text-sm text-muted-foreground">
            You're only signed in on this device. Your account is secure.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Other Active Sessions
          </div>
          <Button variant="outline" size="sm" onClick={onRevokeAll} disabled={isRevoking}>
            {isRevoking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All Others
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            isRevoking={isRevoking && selectedSessionId === session.id}
            onRevoke={onRevokeSession}
          />
        ))}
      </CardContent>
    </Card>
  );
}
