"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { UserProfile, UserStatus, AuthStatus } from "@/types/user-management.types"
import { ROLE_DISPLAY_INFO, isPredefinedRole } from "@/types/role.types"
import {
  MapPin,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Linkedin,
  Shield,
  ShieldCheck,
  Clock,
  User,
  Settings,
  Eye,
  MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserCardProps {
  user: UserProfile
  selected?: boolean
  onSelect?: (checked: boolean) => void
  showSelection?: boolean
  className?: string
}

function getStatusColor(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700"
    case UserStatus.INACTIVE:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
    case UserStatus.SUSPENDED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700"
    case UserStatus.PENDING_VERIFICATION:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700"
    case UserStatus.BANNED:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

function getAuthStatusColor(authStatus: AuthStatus): string {
  switch (authStatus) {
    case AuthStatus.VERIFIED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700"
    case AuthStatus.UNVERIFIED:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
    case AuthStatus.TWO_FACTOR_ENABLED:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700"
    case AuthStatus.TWO_FACTOR_DISABLED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

function getRoleColor(role: string): string {
  if (isPredefinedRole(role)) {
    const displayInfo = ROLE_DISPLAY_INFO[role];
    switch (displayInfo.color) {
      case 'red':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700"
      case 'orange':
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700"
      case 'yellow':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700"
      case 'green':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700"
      case 'cyan':
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700"
      case 'blue':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700"
      case 'indigo':
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700"
      case 'purple':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700"
      case 'pink':
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700"
      case 'slate':
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700"
      case 'zinc':
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
      case 'gray':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
      case 'amber':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700"
      case 'rose':
        return "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700"
      default:
        return "bg-secondary text-secondary-foreground border-border"
    }
  }
  return "bg-secondary text-secondary-foreground border-border"
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  if (isPredefinedRole(role)) {
    const displayInfo = ROLE_DISPLAY_INFO[role];
    switch (displayInfo.category) {
      case 'administrative':
        return 'destructive';
      case 'leadership':
      case 'staff':
        return 'default';
      case 'membership':
        return 'secondary';
      default:
        return 'outline';
    }
  }
  return 'outline';
}

function getStatusAccent(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return "border-l-green-500"
    case UserStatus.INACTIVE:
      return "border-l-gray-500"
    case UserStatus.SUSPENDED:
      return "border-l-orange-500"
    case UserStatus.PENDING_VERIFICATION:
      return "border-l-yellow-500"
    case UserStatus.BANNED:
      return "border-l-red-500"
    default:
      return "border-l-muted"
  }
}

function formatDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date)
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function UserCard({ user, selected, onSelect, showSelection, className }: UserCardProps) {
  const hasSocialLinks = user.linkedin || user.website
  const isInactive = user.status === UserStatus.INACTIVE
  const isBanned = user.status === UserStatus.BANNED

  return (
    <Card
      className={cn(
        "group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4",
        getStatusAccent(user.status),
        "hover:border-primary/20 hover:-translate-y-1",
        (isInactive || isBanned) && "opacity-70 grayscale-[0.3]",
        className
      )}
      role="article"
      aria-label={`User: ${user.firstName} ${user.lastName}, Role: ${user.userRole}, Status: ${user.status.replace("_", " ")}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Handle card click action
        }
      }}
    >
      {/* Selection Checkbox */}
      {showSelection && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="bg-background/90 backdrop-blur-sm border-2"
          />
        </div>
      )}

      {/* Status Indicator Dot */}
      <div className={cn(
        "absolute top-4 right-4 size-2.5 rounded-full",
        user.status === UserStatus.ACTIVE ? "bg-green-500 animate-pulse" : "bg-muted"
      )} />

      <CardContent>
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-5">
          <Avatar className="size-16 ring-2 ring-background shadow-md">
            <AvatarImage
              src={user.avatar}
              alt={`${user.firstName} ${user.lastName}`}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-lg">
              {getInitials(user.firstName || "", user.lastName || "")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                {user.firstName} {user.lastName}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2">
                    <Eye className="size-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Settings className="size-4" />
                    Edit User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive">
                    <User className="size-4" />
                    Manage Access
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {user.username && (
              <p className="text-sm font-medium text-muted-foreground truncate mb-1.5">
                @{user.username}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "text-xs font-semibold px-2 py-0.5",
                  getRoleColor(user.userRole)
                )}
                variant={getRoleBadgeVariant(user.userRole)}
                title={isPredefinedRole(user.userRole) ? ROLE_DISPLAY_INFO[user.userRole].description : user.userRole}
              >
                {isPredefinedRole(user.userRole)
                  ? ROLE_DISPLAY_INFO[user.userRole].name
                  : (String(user.userRole).charAt(0).toUpperCase() + String(user.userRole).slice(1))
                }
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4" role="status" aria-label="User status information">
          <Badge
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5",
              getStatusColor(user.status)
            )}
            variant="outline"
            aria-label={`User status: ${user.status.replace("_", " ")}`}
          >
            <Clock className="size-3" aria-hidden="true" />
            {user.status.replace("_", " ").charAt(0).toUpperCase() + user.status.replace("_", " ").slice(1)}
          </Badge>
          <Badge
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5",
              getAuthStatusColor(user.authStatus)
            )}
            variant="outline"
            aria-label={`Authentication status: ${user.authStatus.replace("_", " ")}`}
          >
            <Shield className="size-3" aria-hidden="true" />
            {user.authStatus === "two_factor_enabled" ? "2FA" :
             user.authStatus.charAt(0).toUpperCase() + user.authStatus.slice(1)}
          </Badge>
        </div>

        {/* Contact Info Grid */}
        <div className="space-y-2.5 mb-4 pb-4 border-b">
          {user.location && (
            <div className="flex items-center gap-2.5 text-sm group/item">
              <MapPin className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
              <span className="text-foreground/80 truncate">{user.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-sm group/item">
            <Mail className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
            <span className="text-foreground/80 truncate">{user.email}</span>
            {user.emailVerified && (
              <ShieldCheck className="size-3 text-green-500 flex-shrink-0" />
            )}
          </div>

          {user.phone && (
            <div className="flex items-center gap-2.5 text-sm group/item">
              <Phone className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
              <span className="text-foreground/80">{user.phone}</span>
              {user.phoneVerified && (
                <ShieldCheck className="size-3 text-green-500 flex-shrink-0" />
              )}
            </div>
          )}
        </div>

        {/* User Info - Clean Layout */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Calendar className="size-3.5" />
              <span>Joined</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatDateString(user.createdAt)}
            </span>
          </div>

          {user.lastLoginAt && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <Clock className="size-3.5" />
                <span>Last Login</span>
              </div>
              <span className="font-semibold text-foreground">
                {formatDateString(user.lastLoginAt)}
              </span>
            </div>
          )}

          {user.bio && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground line-clamp-2">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Social Links */}
        {hasSocialLinks && (
          <div className="flex items-center gap-3 pt-3 border-t">
            {user.linkedin && (
              <a
                href={user.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-8 rounded-full bg-muted/50 text-muted-foreground hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-110"
                onClick={(e) => e.stopPropagation()}
                aria-label="LinkedIn profile"
              >
                <Linkedin className="size-4" />
              </a>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center size-8 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                onClick={(e) => e.stopPropagation()}
                aria-label="Personal website"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}