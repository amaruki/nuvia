"use client"

import * as React from "react"

interface UseSidebarProps {
  defaultCollapsed?: boolean
  storageKey?: string
}

export function useSidebar({
  defaultCollapsed = false,
  storageKey = "nuvia-sidebar-state"
}: UseSidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [isMobile, setIsMobile] = React.useState(false)

  // Initialize from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      setIsCollapsed(JSON.parse(stored))
    }
    
    // Check if we're on mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)
    
    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [storageKey])

  // Update localStorage when isCollapsed changes
  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isCollapsed))
  }, [isCollapsed, storageKey])

  // Auto-collapse on mobile
  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
    }
  }, [isMobile])

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const expandSidebar = React.useCallback(() => {
    setIsCollapsed(false)
  }, [])

  const collapseSidebar = React.useCallback(() => {
    setIsCollapsed(true)
  }, [])

  return {
    isCollapsed,
    isMobile,
    toggleSidebar,
    expandSidebar,
    collapseSidebar,
    setIsCollapsed
  }
}