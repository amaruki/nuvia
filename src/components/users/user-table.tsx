"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserProfile, UserSort, UserStatus, AuthStatus } from "@/types/user-management.types"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Settings,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  ExternalLink,
  Linkedin
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UserTableProps {
  users: UserProfile[]
  selectedUsers: string[]
  onSelectUser: (userId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  sort: UserSort
  onSort: (sort: UserSort) => void
  showSelection?: boolean
  className?: string
}

interface SortableHeaderProps {
  children: React.ReactNode
  field: UserSort["field"]
  currentSort: UserSort
  onSort: (sort: UserSort) => void
  className?: string
}

function SortableHeader({ children, field, currentSort, onSort, className }: SortableHeaderProps) {
  const isCurrentField = currentSort.field === field
  const direction = isCurrentField ? currentSort.direction : "asc"

  const handleSort = () => {
    onSort({
      field,
      direction: isCurrentField && direction === "asc" ? "desc" : "asc"
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 data-[state=open]:bg-accent",
        className
      )}
      onClick={handleSort}
      aria-label={`Sort by ${field}`}
      aria-sort={
        isCurrentField
          ? direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <span>{children}</span>
      {isCurrentField ? (
        direction === "asc" ? (
          <ArrowUp className="ml-2 size-4" />
        ) : (
          <ArrowDown className="ml-2 size-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 size-4" />
      )}
    </Button>
  )
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
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700"
    case "moderator":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700"
    case "member":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date)
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export function UserTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  sort,
  onSort,
  showSelection = false,
  className
}: UserTableProps) {
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedRowIndex(prev => prev === null ? 0 : Math.min(prev + 1, users.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedRowIndex(prev => prev === null ? 0 : Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        // Handle row action (view details)
        break
      case " ":
        if (showSelection) {
          e.preventDefault()
          onSelectUser(users[index].id, !selectedUsers.includes(users[index].id))
        }
        break
    }
  }

  const allSelected = showSelection && selectedUsers.length === users.length && users.length > 0
  const someSelected = showSelection && selectedUsers.length > 0 && selectedUsers.length < users.length

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30">
                {showSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      ref={(node: any) => {
                        if (node) node.indeterminate = someSelected
                      }}
                      onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                      aria-label="Select all users"
                    />
                  </TableHead>
                )}
                <TableHead className="w-[300px]">
                  <SortableHeader field="name" currentSort={sort} onSort={onSort}>
                    User
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortableHeader field="userRole" currentSort={sort} onSort={onSort}>
                    Role
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortableHeader field="status" currentSort={sort} onSort={onSort}>
                    Status
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[150px]">Contact</TableHead>
                <TableHead className="w-[120px]">Location</TableHead>
                <TableHead className="w-[150px]">
                  <SortableHeader field="lastLoginAt" currentSort={sort} onSort={onSort}>
                    Last Login
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortableHeader field="createdAt" currentSort={sort} onSort={onSort}>
                    Joined
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 cursor-pointer",
                    focusedRowIndex === index && "bg-muted/50 ring-2 ring-primary ring-inset ring-offset-0",
                    selectedUsers.includes(user.id) && "bg-muted/30"
                  )}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setFocusedRowIndex(index)}
                  onBlur={() => setFocusedRowIndex(null)}
                >
                  {showSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={user.avatar}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                          {getInitials(user.firstName || "", user.lastName || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.username && (
                            <span className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </span>
                          )}
                        </div>
                        {user.bio && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {user.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5",
                        getRoleColor(user.userRole)
                      )}
                      variant="outline"
                    >
                      {user.userRole.charAt(0).toUpperCase() + user.userRole.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 w-full justify-center",
                          getStatusColor(user.status)
                        )}
                        variant="outline"
                      >
                        {user.status.replace("_", " ").charAt(0).toUpperCase() + user.status.replace("_", " ").slice(1)}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs px-2 py-0.5 w-full justify-center",
                          getAuthStatusColor(user.authStatus)
                        )}
                        variant="outline"
                      >
                        {user.authStatus === "two_factor_enabled" ? "2FA" :
                         user.authStatus.charAt(0).toUpperCase() + user.authStatus.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{user.email}</span>
                        {user.emailVerified && (
                          <div className="size-3 rounded-full bg-green-500" title="Email verified" />
                        )}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{user.phone}</span>
                          {user.phoneVerified && (
                            <div className="size-3 rounded-full bg-green-500" title="Phone verified" />
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.location && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="size-3 text-muted-foreground" />
                        <span className="truncate max-w-[100px]">{user.location}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt && (
                      <div className="text-sm" title={formatDate(user.lastLoginAt)}>
                        {formatRelativeTime(user.lastLoginAt)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm" title={formatDate(user.createdAt)}>
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${user.firstName} ${user.lastName}`}
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
                        {user.linkedin && (
                          <DropdownMenuItem asChild>
                            <a
                              href={user.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-2"
                            >
                              <Linkedin className="size-4" />
                              LinkedIn
                            </a>
                          </DropdownMenuItem>
                        )}
                        {user.website && (
                          <DropdownMenuItem asChild>
                            <a
                              href={user.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-2"
                            >
                              <ExternalLink className="size-4" />
                              Website
                            </a>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}