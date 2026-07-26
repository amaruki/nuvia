"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import { User, Crown, Calendar, Settings } from "lucide-react";
import Image from "next/image";
import { UserProfile } from "@/types/dashboard.types";

interface UserProfileWidgetProps {
  user?: UserProfile;
  onEditProfile?: () => void;
  onManageMembership?: () => void;
}

// Mock user data - in a real app, this would come from an API
const mockUser: UserProfile = {
  id: "1",
  username: "johndoe",
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  profilePhoto: "", // URL to profile photo
  membershipTier: "premium",
  membershipStatus: "active",
  joinDate: new Date("2023-01-15"),
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case "basic":
      return "bg-muted text-muted-foreground";
    case "premium":
      return "bg-info/20 text-info";
    case "vip":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-chart-2/20 text-success";
    case "expired":
      return "bg-destructive/20 text-destructive";
    case "pending":
      return "bg-warning/20 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function UserProfileWidget({
  user = mockUser,
  onEditProfile,
  onManageMembership,
}: UserProfileWidgetProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <WidgetContainer
      type="user-profile"
      title="Profile"
      description="Your membership information"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col items-center space-y-4">
            {/* Profile Photo */}
            <div className="relative">
              {user.profilePhoto ? (
                <Image
                  src={user.profilePhoto}
                  alt={`${user.firstName} ${user.lastName}` || user.username}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-10 w-10 text-foreground/50" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <Settings className="h-3 w-3" style={{ color: "var(--primary-foreground)" }} />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                @{user.username}
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {user.email}
              </p>
            </div>

            {/* Membership Info */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Membership
                  </span>
                </div>
                <Badge className={getTierColor(user.membershipTier)}>
                  {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      user.membershipStatus === "active"
                        ? "bg-chart-2"
                        : user.membershipStatus === "expired"
                          ? "bg-destructive"
                          : "bg-warning"
                    }`}
                  ></div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Status
                  </span>
                </div>
                <Badge className={getStatusColor(user.membershipStatus)}>
                  {user.membershipStatus.charAt(0).toUpperCase() + user.membershipStatus.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Member since
                </span>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {formatDate(user.joinDate)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <Button variant="outline" className="w-full" onClick={onEditProfile}>
                Edit Profile
              </Button>
              <Button variant="default" className="w-full" onClick={onManageMembership}>
                Manage Membership
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
