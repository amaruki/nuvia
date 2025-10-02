import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { MoreHorizontal, Settings } from "lucide-react"

interface WidgetHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  }
  menu?: React.ReactNode
  className?: string
}

export function WidgetHeader({
  title,
  description,
  action,
  menu,
  className,
}: WidgetHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold leading-none tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {action && (
          <Button
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
        {menu && (
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}