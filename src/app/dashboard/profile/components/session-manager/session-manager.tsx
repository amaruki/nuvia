"use client";

import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AlertCircle, CheckCircle } from "lucide-react";

import {
  getUserSessionsAction,
  revokeAllOtherSessionsAction,
  revokeSessionAction,
} from "@/lib/actions/auth.actions";
import { logger } from "@/lib/logger";

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
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

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
    try {
      setIsRevokingAll(true);
      const result = await revokeAllOtherSessionsAction();
      if (result.success) {
        setIsRevokeAllOpen(false);
        setIsSuccess(true);
        // Keep only the current session
        setSessions(sessions.filter((s) => s.isCurrent));
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setError(result.message || "Failed to revoke other sessions");
      }
    } catch (err) {
      setError(errorMessage(err, "Failed to revoke other sessions"));
    } finally {
      setIsRevokingAll(false);
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-40" />
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
        onRevokeAll={() => setIsRevokeAllOpen(true)}
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

      {/* Revoke-all confirmation (AlertDialog contract; was a native confirm()). */}
      <AlertDialog
        open={isRevokeAllOpen}
        onOpenChange={(open) => {
          if (!open && !isRevokingAll) setIsRevokeAllOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all other devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingAll}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isRevokingAll}
              onClick={handleRevokeAllOtherSessions}
            >
              {isRevokingAll ? "Revoking..." : "Revoke all"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
