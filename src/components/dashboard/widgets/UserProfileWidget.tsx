import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { User, Crown, Calendar, Settings } from "lucide-react"
import Image from "next/image"
import { UserProfile } from "@/types/dashboard.types"

interface UserProfileWidgetProps {
  user?: UserProfile
  onEditProfile?: () => void
  onManageMembership?: () => void
}

// Mock user data - in a real app, this would come from an API
const mockUser: UserProfile = {
  id: "1",
  username: "johndoe",
  email: "john.doe@example.com",
  displayName: "John Doe",
  profilePhoto: "", // URL to profile photo
  membershipTier: "premium",
  membershipStatus: "active",
  joinDate: new Date("2023-01-15"),
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case "basic":
      return "bg-gray-100 text-gray-800"
    case "premium":
      return "bg-blue-100 text-blue-800"
    case "vip":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "expired":
      return "bg-red-100 text-red-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function UserProfileWidget({ 
  user = mockUser, 
  onEditProfile,
  onManageMembership 
}: UserProfileWidgetProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

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
                  alt={user.displayName || user.username}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-500" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Settings className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.displayName || user.username}
              </h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {/* Membership Info */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Membership</span>
                </div>
                <Badge className={getTierColor(user.membershipTier)}>
                  {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    user.membershipStatus === "active" ? "bg-green-500" :
                    user.membershipStatus === "expired" ? "bg-red-500" : "bg-yellow-500"
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <Badge className={getStatusColor(user.membershipStatus)}>
                  {user.membershipStatus.charAt(0).toUpperCase() + user.membershipStatus.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Member since</span>
                <span className="text-sm text-gray-500">{formatDate(user.joinDate)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onEditProfile}
              >
                Edit Profile
              </Button>
              <Button 
                variant="default" 
                className="w-full"
                onClick={onManageMembership}
              >
                Manage Membership
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}