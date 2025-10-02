import * as React from "react"
import { cn } from "@/lib/utils"
import { Inbox, AlertCircle, Info } from "lucide-react"

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: "inbox" | "alert" | "info" | React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }
  className?: string
}

export function EmptyState({
  title = "No data available",
  description = "There's nothing to show here yet.",
  icon = "inbox",
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon
    }

    switch (icon) {
      case "alert":
        return <AlertCircle className="h-12 w-12 text-gray-400" />
      case "info":
        return <Info className="h-12 w-12 text-gray-400" />
      case "inbox":
      default:
        return <Inbox className="h-12 w-12 text-gray-400" />
    }
  }

  return (
    <div className={cn("text-center py-12", className)}>
      <div className="flex justify-center mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md",
            action.variant === "default" && "text-white bg-gray-900 hover:bg-gray-800",
            action.variant === "destructive" && "text-white bg-red-600 hover:bg-red-700",
            action.variant === "outline" && "text-gray-700 bg-white border-gray-300 hover:bg-gray-50",
            action.variant === "secondary" && "text-gray-900 bg-gray-100 hover:bg-gray-200",
            action.variant === "ghost" && "text-gray-700 hover:bg-gray-100",
            action.variant === "link" && "text-blue-600 hover:text-blue-800",
            !action.variant && "text-white bg-gray-900 hover:bg-gray-800"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}