import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
  Activity,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import type { UserProfile } from "@/types/user-management.types";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  formatDate,
  getAuthStatusColor,
  getRoleColor,
  getStatusColor,
} from "./helpers";

interface OverviewTabProps {
  user: UserProfile;
}

export default function OverviewTab({ user }: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      {/* Status and Role */}
      <div className="flex flex-wrap gap-3">
        <Badge
          className={cn("text-sm font-semibold px-3 py-1", getRoleColor(user.userRole))}
          variant="outline"
        >
          <User className="size-3 mr-1" />
          {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
        </Badge>

        <Badge
          className={cn("text-sm font-semibold px-3 py-1", getStatusColor(user.status))}
          variant="outline"
        >
          <Clock className="size-3 mr-1" />
          {user.status.replace("_", " ").charAt(0).toUpperCase() +
            user.status.replace("_", " ").slice(1)}
        </Badge>

        <Badge
          className={cn("text-sm font-semibold px-3 py-1", getAuthStatusColor(user.authStatus))}
          variant="outline"
        >
          <Shield className="size-3 mr-1" />
          {user.authStatus === "two_factor_enabled"
            ? "2FA Enabled"
            : user.authStatus.charAt(0).toUpperCase() + user.authStatus.slice(1)}
        </Badge>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <span className="font-medium">Email</span>
                {user.emailVerified && <ShieldCheck className="size-4 text-green-500" />}
              </div>
              <div className="text-sm text-foreground/80 ml-6">{user.email}</div>
            </div>

            {user.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="font-medium">Phone</span>
                  {user.phoneVerified && <ShieldCheck className="size-4 text-green-500" />}
                </div>
                <div className="text-sm text-foreground/80 ml-6">{user.phone}</div>
              </div>
            )}

            {user.location && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="font-medium">Location</span>
                </div>
                <div className="text-sm text-foreground/80 ml-6">{user.location}</div>
              </div>
            )}

            {user.timezone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="font-medium">Timezone</span>
                </div>
                <div className="text-sm text-foreground/80 ml-6">{user.timezone}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {user.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{user.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="font-medium">Member Since</span>
              </div>
              <div className="text-sm text-foreground/80 ml-6">{formatDate(user.createdAt)}</div>
            </div>

            {user.lastLoginAt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="size-4 text-muted-foreground" />
                  <span className="font-medium">Last Login</span>
                </div>
                <div className="text-sm text-foreground/80 ml-6">
                  {formatDate(user.lastLoginAt)}
                  <span className="text-muted-foreground ml-2">
                    ({formatRelativeTime(user.lastLoginAt)})
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
