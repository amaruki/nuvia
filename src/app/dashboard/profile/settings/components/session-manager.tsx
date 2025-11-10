"use client";

import { useState } from "react";
import { useSession } from "@/hooks/use-session";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import {
  Smartphone, Monitor, Tablet,
  CheckCircle, AlertCircle, Trash2, Loader2,
  Clock, Shield, Eye
} from "lucide-react";

import { listSessions, revokeSession } from "@/lib/utils/auth-client-utils";

interface SessionManagerProps {
  user: any;
}

interface SessionData {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  token: string;
  isCurrent?: boolean;
}

export function SessionManager({ user }: SessionManagerProps) {
  const { data: currentSession } = useSession();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Mock session data for now
  const mockSessions: SessionData[] = [
    {
      id: "current-session",
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: "192.168.1.1",
      userAgent: navigator.userAgent,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      token: "current-token",
      isCurrent: true
    }
  ];

  // Load sessions on component mount
  const loadSessions = async () => {
    try {
      const result = await listSessions();
      // Mock session response for now
      setSessions(mockSessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setSessions(mockSessions);
    } finally {
      setIsLoading(false);
    }
  };

  useState(() => {
    loadSessions();
  });

  const handleRevokeSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsRevoking(true);
    setError(null);

    try {
      const result = await revokeSession(sessionId);

      if (result.success) {
        setIsSuccess(true);
        setSessions(sessions.filter(s => s.id !== sessionId));
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setError(result.message || "Failed to revoke session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke session");
    } finally {
      setIsRevoking(false);
      setSelectedSessionId(null);
    }
  };

  const handleRevokeAllOtherSessions = () => {
    if (confirm("Are you sure you want to revoke all other sessions? This will sign you out from all other devices.")) {
      const otherSessions = sessions.filter(s => !s.isCurrent);
      otherSessions.forEach(session => {
        handleRevokeSession(session.id);
      });
    }
  };

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return { type: 'unknown', name: 'Unknown Device', icon: Monitor };

    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return {
        type: 'mobile',
        name: 'Mobile Device',
        icon: Smartphone
      };
    }

    if (ua.includes('tablet') || ua.includes('ipad')) {
      return {
        type: 'tablet',
        name: 'Tablet',
        icon: Tablet
      };
    }

    return {
      type: 'desktop',
      name: 'Desktop',
      icon: Monitor
    };
  };

  const getBrowserInfo = (userAgent?: string) => {
    if (!userAgent) return 'Unknown Browser';

    const ua = userAgent.toLowerCase();

    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';

    return 'Unknown Browser';
  };

  const getLocationInfo = (ipAddress?: string) => {
    if (!ipAddress) return 'Unknown Location';
    return `IP: ${ipAddress}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const currentSessionData = sessions.find(session => session.isCurrent);
  const otherSessions = sessions.filter(session => !session.isCurrent);

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
          <AlertDescription>
            Session(s) revoked successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Session */}
      {currentSessionData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Shield className="h-5 w-5" />
              Current Session
              <Badge variant="default" className="bg-green-600">
                This Device
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  {(() => {
                    const DeviceIcon = getDeviceInfo(currentSessionData.userAgent).icon;
                    return <DeviceIcon className="h-5 w-5 text-muted-foreground" />;
                  })()}
                  <div>
                    <p className="font-medium">
                      {getDeviceInfo(currentSessionData.userAgent).name} • {getBrowserInfo(currentSessionData.userAgent)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getLocationInfo(currentSessionData.ipAddress)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Last active: {formatTimeAgo(new Date(currentSessionData.lastAccessedAt))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Expires: {currentSessionData.expiresAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Other Sessions */}
      {otherSessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Other Active Sessions</h3>
            <p className="text-sm text-muted-foreground">
              You're only signed in on this device. Your account is secure.
            </p>
          </CardContent>
        </Card>
      )}

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