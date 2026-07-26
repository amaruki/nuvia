"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile, UserStatus, AuthStatus } from "@/types/user-management.types";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  Clock,
  User,
  Settings,
  ExternalLink,
  Link2 as Linkedin, // lucide-react v1 dropped brand icons — see TODO.md
  Globe,
  Key,
  Activity,
  Eye,
  Edit,
  Ban,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDetailModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: string;
}

function getStatusColor(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700";
    case UserStatus.INACTIVE:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    case UserStatus.SUSPENDED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700";
    case UserStatus.PENDING_VERIFICATION:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700";
    case UserStatus.BANNED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function getAuthStatusColor(authStatus: AuthStatus): string {
  switch (authStatus) {
    case AuthStatus.VERIFIED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700";
    case AuthStatus.UNVERIFIED:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    case AuthStatus.TWO_FACTOR_ENABLED:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700";
    case AuthStatus.TWO_FACTOR_DISABLED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700";
    case "moderator":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700";
    case "member":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export function UserDetailModal({
  user,
  open,
  onOpenChange,
  currentUserRole,
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) return null;

  const isAdmin = currentUserRole === "admin";
  const isModerator = currentUserRole === "moderator";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 ring-2 ring-background shadow-md">
              <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-lg">
                {getInitials(user.firstName || "", user.lastName || "")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <DialogTitle className="text-xl">
                {user.firstName} {user.lastName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                @{user.username}
                <div
                  className={cn(
                    "size-2 rounded-full",
                    user.status === UserStatus.ACTIVE ? "bg-green-500" : "bg-gray-500",
                  )}
                />
                {user.status.replace("_", " ").charAt(0).toUpperCase() +
                  user.status.replace("_", " ").slice(1)}
              </DialogDescription>
            </div>

            <div className="flex gap-2">
              {user.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={user.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="size-4" />
                  </a>
                </Button>
              )}
              {user.linkedin && (
                <Button variant="outline" size="sm" asChild>
                  <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

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
                className={cn(
                  "text-sm font-semibold px-3 py-1",
                  getAuthStatusColor(user.authStatus),
                )}
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
                    <div className="text-sm text-foreground/80 ml-6">
                      {formatDate(user.createdAt)}
                    </div>
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

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">Email Verification</div>
                      <div className="text-sm text-muted-foreground">
                        {user.emailVerified ? "Verified" : "Not verified"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center",
                        user.emailVerified
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-gray-100 dark:bg-gray-900",
                      )}
                    >
                      <Mail
                        className={cn(
                          "size-4",
                          user.emailVerified ? "text-green-600" : "text-gray-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">Phone Verification</div>
                      <div className="text-sm text-muted-foreground">
                        {user.phoneVerified ? "Verified" : "Not verified"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center",
                        user.phoneVerified
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-gray-100 dark:bg-gray-900",
                      )}
                    >
                      <Phone
                        className={cn(
                          "size-4",
                          user.phoneVerified ? "text-green-600" : "text-gray-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">
                        {user.authStatus === "two_factor_enabled" ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center",
                        user.authStatus === "two_factor_enabled"
                          ? "bg-purple-100 dark:bg-purple-900"
                          : "bg-orange-100 dark:bg-orange-900",
                      )}
                    >
                      <Key
                        className={cn(
                          "size-4",
                          user.authStatus === "two_factor_enabled"
                            ? "text-purple-600"
                            : "text-orange-600",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-medium">Account Status</div>
                      <div className="text-sm text-muted-foreground">
                        {user.status.replace("_", " ").charAt(0).toUpperCase() +
                          user.status.replace("_", " ").slice(1)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center",
                        user.status === UserStatus.ACTIVE
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-gray-100 dark:bg-gray-900",
                      )}
                    >
                      <Shield
                        className={cn(
                          "size-4",
                          user.status === UserStatus.ACTIVE ? "text-green-600" : "text-gray-500",
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Activity log coming soon</p>
                  <p className="text-sm">
                    This section will show recent user actions and login history.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="size-4" />
                  User Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <Button variant="outline" className="gap-2 justify-start">
                    <Eye className="size-4" />
                    View Full Profile
                  </Button>

                  {isModerator && (
                    <Button variant="outline" className="gap-2 justify-start">
                      <Edit className="size-4" />
                      Edit User
                    </Button>
                  )}

                  {isModerator && user.status !== UserStatus.ACTIVE && (
                    <Button variant="default" className="gap-2 justify-start">
                      <UserCheck className="size-4" />
                      Activate User
                    </Button>
                  )}

                  {isModerator && user.status === UserStatus.ACTIVE && (
                    <Button variant="outline" className="gap-2 justify-start">
                      <Ban className="size-4" />
                      Suspend User
                    </Button>
                  )}

                  {isAdmin && (
                    <Button variant="outline" className="gap-2 justify-start">
                      <Key className="size-4" />
                      Reset Password
                    </Button>
                  )}

                  <Button variant="outline" className="gap-2 justify-start">
                    <Mail className="size-4" />
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
