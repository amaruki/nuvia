import * as React from "react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "./DashboardHeader"
import { DashboardFooter } from "./DashboardFooter"
import { UserRole } from "@/types/dashboard.types"

interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
  role?: UserRole
  className?: string
  headerProps?: {
    title?: string
    description?: string
    actions?: React.ReactNode
  }
}

export function DashboardLayout({
  children,
  user,
  role = "member",
  className,
  headerProps,
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50 flex flex-col", className)}>
      <DashboardHeader
        title={headerProps?.title}
        description={headerProps?.description}
        user={user}
        actions={headerProps?.actions}
      />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <DashboardFooter />
    </div>
  )
}