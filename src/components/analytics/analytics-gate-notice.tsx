import { LockKeyhole, LogIn } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export type AnalyticsGateState = "signed-out" | "forbidden";

export interface AnalyticsGateNoticeProps {
  state: AnalyticsGateState;
  /** Roles navigation-data allows for this path, when known; shown so the gate explains itself. */
  allowedRoles?: readonly string[];
}

/**
 * What an unauthorized visitor sees instead of analytics. The message is
 * honest about why: no invented zeros, no silently empty charts.
 */
export function AnalyticsGateNotice({ state, allowedRoles }: AnalyticsGateNoticeProps) {
  const signedOut = state === "signed-out";
  const roleList =
    allowedRoles && allowedRoles.length > 0
      ? ` This section is limited to: ${allowedRoles
          .map((role) => role.replaceAll("_", " "))
          .join(", ")}.`
      : "";

  return (
    <Card>
      <CardContent className="pt-6">
        <EmptyState
          icon={
            signedOut ? (
              <LogIn aria-hidden className="h-10 w-10 text-muted-foreground" />
            ) : (
              <LockKeyhole aria-hidden className="h-10 w-10 text-muted-foreground" />
            )
          }
          title={signedOut ? "Sign in required" : "No access to this analytics section"}
          description={
            signedOut
              ? "Analytics are only visible to signed-in members. Sign in to see real activity data for your organization."
              : `Your role does not include access to this analytics section.${roleList}`
          }
        />
      </CardContent>
    </Card>
  );
}
