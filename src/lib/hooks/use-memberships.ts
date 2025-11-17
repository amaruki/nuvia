"use client"

import { useState, useCallback, useEffect } from "react"
import { MembershipFilter, MembershipSort, MembershipDirectoryResponse, MembershipProfile, MembershipTier, MembershipStatus } from "@/types/membership.types"

interface UseMembershipsOptions {
  initialFilters?: MembershipFilter
  initialSort?: MembershipSort
  pageSize?: number
}

interface UseMembershipsReturn {
  members: MembershipProfile[]
  isLoading: boolean
  error: Error | null
  total: number
  hasMore: boolean
  filters: MembershipFilter
  sort: MembershipSort
  page: number
  updateFilters: (filters: MembershipFilter) => void
  updateSort: (sort: MembershipSort) => void
  loadMore: () => void
  refresh: () => void
  reset: () => void
}

export function useMemberships({
  initialFilters = {},
  initialSort = { field: "name", direction: "asc" },
  pageSize = 12
}: UseMembershipsOptions = {}): UseMembershipsReturn {
  const [members, setMembers] = useState<MembershipProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState<MembershipFilter>(initialFilters)
  const [sort, setSort] = useState<MembershipSort>(initialSort)
  const [page, setPage] = useState(1)

  // Mock data generator - replace with actual API call
  const generateMockMembers = useCallback((
    page: number,
    pageSize: number,
    filters: MembershipFilter,
    sort: MembershipSort
  ): Promise<MembershipDirectoryResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockMembers: MembershipProfile[] = Array.from({ length: pageSize }, (_, index) => {
          const globalIndex = (page - 1) * pageSize + index
          const tiers = ["basic", "professional", "corporate", "student", "vip", "premium"] as const
          const statuses = ["active", "expired", "pending", "suspended", "cancelled"] as const
          const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Jennifer"]
          const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
          const companies = ["TechCorp", "Innovation Inc", "Digital Solutions", "Cloud Systems", "DataDrive", "NextGen Tech"]
          const locations = ["New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA", "Boston, MA"]
          const jobs = ["Software Engineer", "Product Manager", "Designer", "Data Scientist", "CTO", "VP Engineering"]
          const chapters = ["NYC Chapter", "SF Bay Area", "Austin Tech", "Seattle Innovation", "Boston Tech Hub"]
          const firstName = firstNames[globalIndex % firstNames.length]
          const lastName = lastNames[Math.floor(globalIndex / firstNames.length) % lastNames.length]

          return {
            id: `member-${globalIndex + 1}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            firstName,
            lastName,
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${globalIndex + 1}`,
            joinDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000), // Random date within last 2 years
            membershipTier: tiers[globalIndex % tiers.length] as MembershipTier,
            membershipStatus: statuses[Math.floor(globalIndex / 6) % statuses.length] as MembershipStatus,
            membershipStartDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            membershipEndDate: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000) : null,
            chapter: chapters[globalIndex % chapters.length],
            location: locations[globalIndex % locations.length],
            company: companies[globalIndex % companies.length],
            jobTitle: jobs[globalIndex % jobs.length],
            bio: `Experienced professional with expertise in technology and innovation. Passionate about community building and knowledge sharing.`,
            applicationDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
            lastRenewalDate: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : undefined,
            memberId: `M${String(globalIndex + 1).padStart(6, "0")}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}-${lastName}-${globalIndex}`,
            phone: `+1 (555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
            linkedin: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            website: `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com`,
            skills: ["JavaScript", "React", "Node.js", "TypeScript", "Leadership"].slice(0, Math.floor(Math.random() * 4) + 2),
            interests: ["Technology", "Innovation", "Networking", "Mentoring"].slice(0, Math.floor(Math.random() * 3) + 1),
            committees: ["Events", "Membership", "Professional Development"].slice(0, Math.floor(Math.random() * 2) + 1),
            userRole: "member" as any,
            status: "active" as any,
            authStatus: "verified" as any,
            emailVerified: true,
            phoneVerified: Math.random() > 0.5,
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          }
        })

        // Apply mock filtering (in a real app, this would be done server-side)
        let filteredMembers = mockMembers
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredMembers = filteredMembers.filter(member =>
            member.firstName!.toLowerCase().includes(searchLower) ||
            member.lastName!.toLowerCase().includes(searchLower) ||
            member.email.toLowerCase().includes(searchLower) ||
            member.company?.toLowerCase().includes(searchLower)
          )
        }

        if (filters.tiers?.length) {
          filteredMembers = filteredMembers.filter(member =>
            filters.tiers!.includes(member.membershipTier)
          )
        }

        if (filters.statuses?.length) {
          filteredMembers = filteredMembers.filter(member =>
            filters.statuses!.includes(member.membershipStatus)
          )
        }

        if (filters.locations?.length) {
          filteredMembers = filteredMembers.filter(member =>
            filters.locations!.includes(member.location || "")
          )
        }

        // Apply mock sorting (in a real app, this would be done server-side)
        filteredMembers.sort((a, b) => {
          let aValue: any
          let bValue: any

          switch (sort.field) {
            case "name":
              aValue = `${a.firstName} ${a.lastName}`
              bValue = `${b.firstName} ${b.lastName}`
              break
            case "membershipStartDate":
              aValue = a.membershipStartDate.getTime()
              bValue = b.membershipStartDate.getTime()
              break
            case "membershipTier":
              aValue = a.membershipTier
              bValue = b.membershipTier
              break
            case "location":
              aValue = a.location || ""
              bValue = b.location || ""
              break
            case "company":
              aValue = a.company || ""
              bValue = b.company || ""
              break
            default:
              return 0
          }

          if (aValue < bValue) return sort.direction === "asc" ? -1 : 1
          if (aValue > bValue) return sort.direction === "asc" ? 1 : -1
          return 0
        })

        const total = filteredMembers.length + 847 // Mock total count
        const paginatedMembers = filteredMembers.slice(0, pageSize)

        resolve({
          members: paginatedMembers,
          total,
          page,
          pageSize,
          hasMore: page * pageSize < total
        })
      }, 500 + Math.random() * 500) // Random delay to simulate network
    })
  }, [pageSize])

  const fetchMembers = useCallback(async (
    pageNum: number,
    isLoadMore = false
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await generateMockMembers(pageNum, pageSize, filters, sort)

      if (isLoadMore) {
        setMembers(prev => [...prev, ...response.members])
      } else {
        setMembers(response.members)
      }

      setTotal(response.total)
      setHasMore(response.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch members"))
      if (!isLoadMore) {
        setMembers([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters, sort, pageSize, generateMockMembers])

  const updateFilters = useCallback((newFilters: MembershipFilter) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const updateSort = useCallback((newSort: MembershipSort) => {
    setSort(newSort)
    setPage(1)
  }, [])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMembers(nextPage, true)
    }
  }, [isLoading, hasMore, page, fetchMembers])

  const refresh = useCallback(() => {
    setPage(1)
    fetchMembers(1, false)
  }, [fetchMembers])

  const reset = useCallback(() => {
    setFilters(initialFilters)
    setSort(initialSort)
    setPage(1)
    setMembers([])
    setTotal(0)
    setHasMore(true)
    setError(null)
  }, [initialFilters, initialSort])

  // Initial fetch
  useEffect(() => {
    fetchMembers(1, false)
  }, [filters, sort, fetchMembers])

  return {
    members,
    isLoading,
    error,
    total,
    hasMore,
    filters,
    sort,
    page,
    updateFilters,
    updateSort,
    loadMore,
    refresh,
    reset
  }
}

// Helper hook for filter state management
export function useMembershipFilters(initialFilters: MembershipFilter = {}) {
  const [filters, setFilters] = useState<MembershipFilter>(initialFilters)

  const updateFilters = useCallback((newFilters: MembershipFilter) => {
    setFilters(newFilters)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof MembershipFilter]
      return value !== undefined && value !== null &&
             (Array.isArray(value) ? value.length > 0 : true)
    })
  }, [filters])

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters()
  }
}