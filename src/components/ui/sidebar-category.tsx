"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarNotificationBadge,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronDown, ChevronRight } from "lucide-react"

/**
 * Props for the SidebarCategory component
 */
interface SidebarCategoryProps {
  /** Unique identifier for the category */
  id: string
  /** Title of the category */
  title: string
  /** Icon to display for the category */
  icon: React.ReactNode
  /** Items within this category */
  items: SidebarCategoryItemProps[]
  /** Optional badge count to display */
  badge?: number
  /** Whether the category is expanded by default */
  defaultExpanded?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for the SidebarCategoryItem component
 */
interface SidebarCategoryItemProps {
  /** Unique identifier for the item */
  id: string
  /** Title of the item */
  title: string
  /** Icon to display for the item */
  icon: React.ReactNode
  /** Navigation path for the item */
  path: string
  /** Description of the item (shown when sidebar is expanded) */
  description?: string
  /** Optional sub-items for hierarchical navigation */
  subItems?: Omit<SidebarCategoryItemProps, 'subItems'>[]
  /** Optional badge count to display */
  badge?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * A sidebar category component that groups related navigation items
 * with expand/collapse functionality
 */
export function SidebarCategory({
  id,
  title,
  icon,
  items,
  badge,
  defaultExpanded = false,
  className,
}: SidebarCategoryProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const { state } = useSidebar()
  const pathname = usePathname()

  // Check if any item in this category is active
  const hasActiveItem = React.useMemo(() => {
    return items.some(item => {
      if (item.path === pathname) return true
      return item.subItems?.some(subItem => subItem.path === pathname)
    })
  }, [items, pathname])

  // Auto-expand if an item is active
  React.useEffect(() => {
    if (hasActiveItem && !isExpanded) {
      setIsExpanded(true)
    }
  }, [hasActiveItem, isExpanded])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <SidebarGroup className={cn("w-full", className)}>
      <SidebarGroupLabel
        className={cn(
          "flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5",
          hasActiveItem && "bg-sidebar-accent/80 text-sidebar-accent-foreground"
        )}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
          {badge && badge > 0 && (
            <SidebarNotificationBadge count={badge} />
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </SidebarGroupLabel>
      
      {isExpanded && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarCategoryItem
                key={item.id}
                {...item}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  )
}

/**
 * A sidebar category item component that handles navigation and
 * can display sub-items with expand/collapse functionality
 */
export function SidebarCategoryItem({
  id,
  title,
  icon,
  path,
  description,
  subItems,
  badge,
  className,
}: SidebarCategoryItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { state, setActiveItem } = useSidebar()
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  const isActive = path === pathname
  
  // Check if any sub-item is active
  const hasActiveSubItem = React.useMemo(() => {
    return subItems?.some(subItem => subItem.path === pathname)
  }, [subItems, pathname])

  // Auto-expand if a sub-item is active
  React.useEffect(() => {
    if (hasActiveSubItem && !isExpanded) {
      setIsExpanded(true)
    }
  }, [hasActiveSubItem, isExpanded])

  const handleNavigate = () => {
    if (path) {
      router.push(path)
      if (setActiveItem) {
        setActiveItem(id)
      }
    }
  }

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <SidebarMenuItem className={cn("w-full", className)}>
        <SidebarMenuButton
          id={id}
          isActive={isActive || hasActiveSubItem}
          variant="dashboard"
          size="dashboard"
          tooltip={title}
          onClick={handleNavigate}
          className={cn(
            "group/menu-item",
            (isActive || hasActiveSubItem) && "bg-sidebar-accent/80"
          )}
        >
          {icon}
          <span>{title}</span>
          {badge && badge > 0 && (
            <SidebarNotificationBadge count={badge} />
          )}
          {subItems && subItems.length > 0 && (
            <button
              onClick={toggleExpanded}
              className="ml-auto p-1 rounded hover:bg-sidebar-accent/50"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
        </SidebarMenuButton>
        
        {state !== "collapsed" && description && (
          <p className="text-xs text-muted-foreground ml-11 mt-1 truncate">
            {description}
          </p>
        )}
      </SidebarMenuItem>
      
      {isExpanded && subItems && subItems.length > 0 && (
        <SidebarMenuSub>
          {subItems.map((subItem) => (
            <SidebarMenuSubItem key={subItem.id}>
              <SidebarMenuSubButton
                isActive={subItem.path === pathname}
                onClick={() => {
                  router.push(subItem.path)
                  if (setActiveItem) {
                    setActiveItem(subItem.id)
                  }
                }}
              >
                {subItem.icon}
                <span>{subItem.title}</span>
                {subItem.badge && subItem.badge > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {subItem.badge > 99 ? "99+" : subItem.badge}
                  </Badge>
                )}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </>
  )
}