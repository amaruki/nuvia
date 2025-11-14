"use client"

import { useState } from "react"
import { Search, Filter, X, RotateCcw, Check, Briefcase, Users, Calendar, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { type MembershipFilter, MembershipTier, MembershipStatus } from "@/types/membership.types"

interface MembershipFilterProps {
  filters: MembershipFilter
  onFiltersChange: (filters: MembershipFilter) => void
  isLoading?: boolean
}

const MEMBERSHIP_TIERS = [
  { value: MembershipTier.BASIC, label: "Basic" },
  { value: MembershipTier.PROFESSIONAL, label: "Professional" },
  { value: MembershipTier.CORPORATE, label: "Corporate" },
  { value: MembershipTier.STUDENT, label: "Student" },
  { value: MembershipTier.VIP, label: "VIP" },
  { value: MembershipTier.PREMIUM, label: "Premium" }
]

const MEMBERSHIP_STATUSES = [
  { value: MembershipStatus.ACTIVE, label: "Active" },
  { value: MembershipStatus.EXPIRED, label: "Expired" },
  { value: MembershipStatus.PENDING, label: "Pending" },
  { value: MembershipStatus.SUSPENDED, label: "Suspended" },
  { value: MembershipStatus.CANCELLED, label: "Cancelled" }
]

const SAMPLE_LOCATIONS = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA"
]

const SAMPLE_COMMITTEES = [
  "Events",
  "Finance",
  "Membership",
  "Marketing",
  "Professional Development",
  "Student Outreach",
  "Diversity & Inclusion",
  "Technology",
  "Community Service"
]

export function MembershipFilter({ filters, onFiltersChange, isLoading }: MembershipFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined
    })
  }

  const handleTierChange = (tier: MembershipTier, checked: boolean) => {
    const currentTiers = filters.tiers || []
    const newTiers = checked
      ? [...currentTiers, tier]
      : currentTiers.filter(t => t !== tier)

    onFiltersChange({
      ...filters,
      tiers: newTiers.length > 0 ? newTiers : undefined
    })
  }

  const handleStatusChange = (status: MembershipStatus, checked: boolean) => {
    const currentStatuses = filters.statuses || []
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status)

    onFiltersChange({
      ...filters,
      statuses: newStatuses.length > 0 ? newStatuses : undefined
    })
  }

  const handleLocationChange = (location: string, checked: boolean) => {
    const currentLocations = filters.locations || []
    const newLocations = checked
      ? [...currentLocations, location]
      : currentLocations.filter(l => l !== location)

    onFiltersChange({
      ...filters,
      locations: newLocations.length > 0 ? newLocations : undefined
    })
  }

  const handleCommitteeChange = (committee: string, checked: boolean) => {
    const currentCommittees = filters.committees || []
    const newCommittees = checked
      ? [...currentCommittees, committee]
      : currentCommittees.filter(c => c !== committee)

    onFiltersChange({
      ...filters,
      committees: newCommittees.length > 0 ? newCommittees : undefined
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.tiers?.length) count++
    if (filters.statuses?.length) count++
    if (filters.locations?.length) count++
    if (filters.committees?.length) count++
    if (filters.startDateRange) count++
    if (filters.endDateRange) count++
    return count
  }

  const activeFiltersCount = getActiveFilterCount()

  return (
    <div className="flex flex-col space-y-4">
      {/* Search Bar with Filter Button */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search by name, email, or company..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-32"
          disabled={isLoading}
        />

        {/* Filter Button Inside Search Bar */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 hover:bg-accent"
                disabled={isLoading}
              >
                <Filter className="size-4 mr-1" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 size-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle>Filter Members</DialogTitle>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      disabled={isLoading}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {/* Simple Filter Content */}
              <div className="space-y-4 py-2">
                {/* Membership Tier */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Membership Tier</Label>
                  <div className="flex flex-wrap gap-2">
                    {MEMBERSHIP_TIERS.map((tier) => (
                      <Badge
                        key={tier.value}
                        variant={filters.tiers?.includes(tier.value) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => handleTierChange(tier.value, !filters.tiers?.includes(tier.value))}
                      >
                        {tier.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {MEMBERSHIP_STATUSES.map((status) => (
                      <Badge
                        key={status.value}
                        variant={filters.statuses?.includes(status.value) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => handleStatusChange(status.value, !filters.statuses?.includes(status.value))}
                      >
                        {status.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range - Simple */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Join Date</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      value={filters.startDateRange?.from ? new Date(filters.startDateRange.from).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const fromDate = e.target.value ? new Date(e.target.value) : undefined;
                        onFiltersChange({
                          ...filters,
                          startDateRange: fromDate && filters.startDateRange?.to
                            ? { from: fromDate, to: filters.startDateRange.to }
                            : fromDate
                              ? { from: fromDate, to: new Date() }
                              : undefined
                        });
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      placeholder="To"
                      value={filters.startDateRange?.to ? new Date(filters.startDateRange.to).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const toDate = e.target.value ? new Date(e.target.value) : undefined;
                        onFiltersChange({
                          ...filters,
                          startDateRange: toDate && filters.startDateRange?.from
                            ? { from: filters.startDateRange.from, to: toDate }
                            : toDate && filters.startDateRange?.from
                              ? { from: filters.startDateRange.from, to: toDate }
                              : undefined
                        });
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}