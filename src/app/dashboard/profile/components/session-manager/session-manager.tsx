"use client";

import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

import { AlertCircle, CheckCircle } from "lucide-react";

import {
  getUserSessionsAction,
  revokeAllOtherSessionsAction,
  revokeSessionAction,
} from "@/lib/actions/auth.actions";
import { logger } from "@/lib/logger";

import { confirmRevokeAllOtherSessions } from "./confirm-revoke";
import { CurrentSessionCard } from "./session-card";
import { errorMessage, transformSessions } from "./session-helpers";
import { OtherSessionsCard } from "./session-list";
import type { SessionData, SessionManagerProps } from "./types";

// `_props`: the profile page passes the session user, but sessions load via
// server actions instead — see SessionManagerProps.
export function SessionManager(_props: SessionManagerProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadSessions = async () => {
    try {
      const result = await getUserSessionsAction();

      if (result.success && result.data) {
        setSessions(transformSessions(result.data));
      } else {
        // Set empty array if no sessions found
        setSessions([]);
      }
    } catch (err) {
      logger.error("Failed to load sessions", err);
      setError("Failed to load active sessions");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsRevoking(true);
    setError(null);

    try {
      const result = await revokeSessionAction(sessionId);

      if (result.success) {
        setIsSuccess(true);
        setSessions(sessions.filter((s) => s.id !== sessionId));
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setError(result.message || "Failed to revoke session");
      }
    } catch (err) {
      setError(errorMessage(err, "Failed to revoke session"));
    } finally {
      setIsRevoking(false);
      setSelectedSessionId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (confirmRevokeAllOtherSessions()) {
      try {
        const result = await revokeAllOtherSessionsAction();
        if (result.success) {
          setIsSuccess(true);
          // Keep only the current session
          setSessions(sessions.filter((s) => s.isCurrent));
          setTimeout(() => setIsSuccess(false), 3000);
        } else {
          setError(result.message || "Failed to revoke other sessions");
        }
      } catch (err) {
        setError(errorMessage(err, "Failed to revoke other sessions"));
      }
    }
  };

  const currentSessionData = sessions.find((session) => session.isCurrent);
  const otherSessions = sessions.filter((session) => !session.isCurrent);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-muted rounded w-32"></div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-64"></div>
                  <div className="h-4 bg-muted rounded w-40"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Session(s) revoked successfully!</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Session */}
      {currentSessionData && <CurrentSessionCard session={currentSessionData} />}

      {/* Other Sessions */}
      <OtherSessionsCard
        sessions={otherSessions}
        isRevoking={isRevoking}
        selectedSessionId={selectedSessionId}
        onRevokeAll={handleRevokeAllOtherSessions}
        onRevokeSession={handleRevokeSession}
      />

      {/* Security Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2">Session Security:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Sessions automatically expire after 7 days of inactivity</li>
            <li>• You can revoke sessions from any device at any time</li>
            <li>• Revoking a session will immediately sign out that device</li>
            <li>• Your current session cannot be revoked from this page</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
