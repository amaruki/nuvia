import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Clock, Eye, Shield } from "lucide-react";

import { formatTimeAgo, getBrowserInfo, getDeviceInfo, getLocationInfo } from "./session-helpers";
import type { SessionData } from "./types";

interface CurrentSessionCardProps {
  session: SessionData;
}

export function CurrentSessionCard({ session }: CurrentSessionCardProps) {
  const { icon: DeviceIcon, name: deviceName } = getDeviceInfo(session.userAgent);

  return (
    <Card className="border-success/30 bg-success/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <Shield className="h-5 w-5" />
          Current Session
          <Badge variant="default" className="bg-success text-white">
            This Device
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <DeviceIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {deviceName} • {getBrowserInfo(session.userAgent)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getLocationInfo(session.ipAddress)}
                </p>
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

          <Badge variant="secondary" className="bg-success/15 text-success">
            Active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
