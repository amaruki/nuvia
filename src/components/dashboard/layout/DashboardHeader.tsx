import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Bell, Search, Settings, User } from "lucide-react"
import Image from "next/image"

interface DashboardHeaderProps {
  title?: string
  description?: string
  user?: {
    name: string
    email: string
    avatar?: string
  }
  actions?: React.ReactNode
  className?: string
}

export function DashboardHeader({
  title = "Dashboard",
  description,
  user,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <header className={cn("bg-white border-b border-gray-200", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search button */}
            <Button variant="ghost" size="sm">
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>

            {/* User menu */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Additional actions */}
            {actions}
          </div>
        </div>
      </div>
    </header>
  )
}