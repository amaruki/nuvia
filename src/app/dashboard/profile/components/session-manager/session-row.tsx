import { Button } from "@/components/ui/button";

import { Clock, Eye, Loader2, Trash2 } from "lucide-react";

import { formatTimeAgo, getBrowserInfo, getDeviceInfo, getLocationInfo } from "./session-helpers";
import type { SessionData } from "./types";

interface SessionRowProps {
  session: SessionData;
  // True only while this exact row's revoke request is in flight.
  isRevoking: boolean;
  onRevoke: (sessionId: string) => void;
}

export function SessionRow({ session, isRevoking, onRevoke }: SessionRowProps) {
  const { icon: DeviceIcon, name: deviceName } = getDeviceInfo(session.userAgent);

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {deviceName} • {getBrowserInfo(session.userAgent)}
            </p>
            <p className="text-sm text-muted-foreground">{getLocationInfo(session.ipAddress)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Last active: {formatTimeAgo(new Date(session.lastAccessedAt))}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>Expires: {session.expiresAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onRevoke(session.id)}
        disabled={isRevoking}
      >
        {isRevoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
