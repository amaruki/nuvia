"use client"

import { useState, useMemo } from "react"
import { UserDirectory } from "@/components/users/user-directory"
import { UserFilter, UserSort, UserProfile, UserStats } from "@/types/user-management.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "@/lib/client"

// Mock data - replace with actual API call
const mockUsers: UserProfile[] = [
  {
    id: "1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    phone: "+1 (555) 123-4567",
    bio: "Senior software engineer with expertise in full-stack development.",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
    linkedin: "https://linkedin.com/in/johndoe",
    timezone: "America/Los_Angeles",
    language: "en",
    userRole: "admin",
    status: "active",
    authStatus: "verified",
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date("2024-01-15T10:30:00Z"),
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-15T10:30:00Z")
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    username: "janesmith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
    phone: "+1 (555) 987-6543",
    bio: "Product manager passionate about user experience and data-driven decisions.",
    location: "New York, NY",
    website: "https://janesmith.io",
    linkedin: "https://linkedin.com/in/janesmith",
    timezone: "America/New_York",
    language: "en",
    userRole: "member",
    status: "active",
    authStatus: "two_factor_enabled",
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: new Date("2024-01-14T15:45:00Z"),
    createdAt: new Date("2023-03-15T00:00:00Z"),
    updatedAt: new Date("2024-01-14T15:45:00Z")
  },
  {
    id: "3",
    email: "mike.johnson@example.com",
    firstName: "Mike",
    lastName: "Johnson",
    username: "mikej",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    phone: "+1 (555) 456-7890",
    bio: "UX designer focused on creating intuitive and accessible interfaces.",
    location: "Austin, TX",
    linkedin: "https://linkedin.com/in/mikejohnson",
    timezone: "America/Chicago",
    language: "en",
    userRole: "member",
    status: "inactive",
    authStatus: "verified",
    emailVerified: true,
    phoneVerified: true,
    lastLoginAt: new Date("2023-12-20T09:15:00Z"),
    createdAt: new Date("2023-06-01T00:00:00Z"),
    updatedAt: new Date("2023-12-20T09:15:00Z")
  }
]

const mockStats: UserStats = {
  totalUsers: 1247,
  activeUsers: 892,
  inactiveUsers: 234,
  suspendedUsers: 12,
  verifiedUsers: 1156,
  unverifiedUsers: 91,
  usersWithTwoFactor: 342,
  roleDistribution: {
    admin: 5,
    moderator: 12,
    member: 1230
  },
  newUsersThisMonth: 47,
  usersLastLogin30Days: 756
}

export default function UserDirectoryPage() {
  const { data: session } = useSession()
  const [filters, setFilters] = useState<UserFilter>({})
  const [sort, setSort] = useState<UserSort>({ field: "createdAt", direction: "desc" })
  const [isLoading, setIsLoading] = useState(false)

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = [...mockUsers]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (filters.roles?.length) {
      filtered = filtered.filter(user => filters.roles!.includes(user.userRole))
    }

    // Apply status filter
    if (filters.statuses?.length) {
      filtered = filtered.filter(user => filters.statuses!.includes(user.status))
    }

    // Apply auth status filter
    if (filters.authStatuses?.length) {
      filtered = filtered.filter(user => filters.authStatuses!.includes(user.authStatus))
    }

    // Apply email verification filter
    if (filters.emailVerified !== undefined) {
      filtered = filtered.filter(user => user.emailVerified === filters.emailVerified)
    }

    // Apply phone verification filter
    if (filters.phoneVerified !== undefined) {
      filtered = filtered.filter(user => user.phoneVerified === filters.phoneVerified)
    }

    // Apply location filter
    if (filters.locations?.length) {
      filtered = filtered.filter(user =>
        user.location && filters.locations!.some(location =>
          user.location!.toLowerCase().includes(location.toLowerCase())
        )
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sort
      let aValue: any = a[field]
      let bValue: any = b[field]

      // Handle name field specially
      if (field === "name") {
        aValue = `${a.firstName} ${a.lastName}`
        bValue = `${b.firstName} ${b.lastName}`
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime()
        bValue = bValue.getTime()
      }

      // Handle null/undefined values
      if (aValue === undefined || aValue === null) aValue = ""
      if (bValue === undefined || bValue === null) bValue = ""

      // Compare
      let result = 0
      if (aValue < bValue) result = -1
      else if (aValue > bValue) result = 1

      return direction === "asc" ? result : -result
    })

    return filtered
  }, [mockUsers, filters, sort])

  const handleFilterChange = (newFilters: UserFilter) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: UserSort) => {
    setSort(newSort)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3-3 3-3"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">User Directory</h1>
              <p className="text-sm text-muted-foreground">Manage and monitor platform users</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <UserDirectory
        users={filteredUsers}
        total={filteredUsers.length}
        stats={mockStats}
        filters={filters}
        sort={sort}
        isLoading={isLoading}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        currentUserRole={session?.user?.userRole as string}
      />
    </div>
  )
}