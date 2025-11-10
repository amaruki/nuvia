"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/hooks/use-session";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { User, Shield, Link, Settings, Camera, Key, Smartphone, Trash2, CheckCircle, AlertCircle } from "lucide-react";

import { ProfileForm } from "./components/profile-form";
import { SecurityForm } from "./components/security-form";
import { SocialLinksForm } from "./components/social-links-form";
import { ProfilePhotoUpload } from "./components/profile-photo-upload";
import { SessionManager } from "./components/session-manager";

const profileTabs = [
  {
    id: "profile",
    label: "Profile Information",
    icon: User,
    description: "Manage your basic profile information and photo"
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password, authentication, and account security"
  },
  {
    id: "social",
    label: "Social Links",
    icon: Link,
    description: "Manage your social media and external links"
  },
  {
    id: "sessions",
    label: "Active Sessions",
    icon: Smartphone,
    description: "View and manage your active sessions"
  }
] as const;

type TabId = typeof profileTabs[number]["id"];

export default function ProfileSettingsPage() {
  const params = useParams();
  const { user, isPending: status } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [isLoading, setIsLoading] = useState(true);

  // Set active tab from URL parameter if available
  useEffect(() => {
    if (params.tab && typeof params.tab === "string") {
      const validTab = profileTabs.find(tab => tab.id === params.tab);
      if (validTab) {
        setActiveTab(validTab.id as TabId);
      }
    }
    setIsLoading(false);
  }, [params.tab]);

  // Show loading state while checking authentication
  if (status || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!status && !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access profile settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Quick Profile Summary */}
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user!.image || undefined} alt={user!.displayName || ""} />
                <AvatarFallback>
                  {user!.displayName?.charAt(0)?.toUpperCase() || user!.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user!.displayName || user!.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user!.email}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {user!.role === "ADMIN" ? "Administrator" : "Member"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
        <TabsList className="grid w-full grid-cols-4">
          {profileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Update your personal information and manage how others see you
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Your name, bio, and other profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user!} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Photo
                </CardTitle>
                <CardDescription>
                  Upload or change your profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfilePhotoUpload user={user!} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Security Settings</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Manage your password, authentication methods, and account security
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityForm user={user!} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra security layer to your account
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Account deletion is permanent and cannot be undone. This feature will be available soon.
                </AlertDescription>
              </Alert>
              <Button variant="destructive" disabled className="mt-4">
                Delete Account (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Social Links & Accounts</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Manage your external links and connected social accounts
            </p>
          </div>

          <SocialLinksForm user={user!} />
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Active Sessions</h2>
            <p className="text-sm text-muted-foreground mb-6">
              View and manage devices where you're currently logged in
            </p>
          </div>

          <SessionManager user={user!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}