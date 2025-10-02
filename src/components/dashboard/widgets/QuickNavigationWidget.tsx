"use client"

import * as React from "react"
import { WidgetContainer } from "../../ui/WidgetContainer"
import { Card, CardContent } from "../../ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "../../ui/Badge"
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings, 
  Bell, 
  BookOpen, 
  Star,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from "lucide-react"

interface QuickNavigationWidgetProps {
  onNavigate?: (path: string) => void
}

// Mock navigation items data - in a real app, this would come from an API or config
const navigationItems = [
  {
    id: "1",
    title: "Dashboard",
    description: "Overview of your community activity",
    icon: <Home className="h-5 w-5 text-blue-500" />,
    path: "/dashboard",
    badge: null,
    isPopular: true,
  },
  {
    id: "2",
    title: "Community",
    description: "Connect with other members",
    icon: <Users className="h-5 w-5 text-purple-500" />,
    path: "/community",
    badge: "New",
    isPopular: true,
  },
  {
    id: "3",
    title: "Events",
    description: "Upcoming and past events",
    icon: <Calendar className="h-5 w-5 text-green-500" />,
    path: "/events",
    badge: "3",
    isPopular: true,
  },
  {
    id: "4",
    title: "Articles",
    description: "Latest articles and resources",
    icon: <FileText className="h-5 w-5 text-yellow-500" />,
    path: "/articles",
    badge: null,
    isPopular: false,
  },
  {
    id: "5",
    title: "Discussions",
    description: "Join conversations with the community",
    icon: <MessageSquare className="h-5 w-5 text-pink-500" />,
    path: "/discussions",
    badge: "12",
    isPopular: false,
  },
  {
    id: "6",
    title: "Certificates",
    description: "View and download your certificates",
    icon: <BookOpen className="h-5 w-5 text-indigo-500" />,
    path: "/certificates",
    badge: null,
    isPopular: false,
  },
  {
    id: "7",
    title: "Settings",
    description: "Manage your account preferences",
    icon: <Settings className="h-5 w-5 text-gray-500" />,
    path: "/settings",
    badge: null,
    isPopular: false,
  },
  {
    id: "8",
    title: "Notifications",
    description: "View your recent notifications",
    icon: <Bell className="h-5 w-5 text-red-500" />,
    path: "/notifications",
    badge: "5",
    isPopular: false,
  },
]

export function QuickNavigationWidget({
  onNavigate,
}: QuickNavigationWidgetProps) {
  // Sort items: popular items first, then by title
  const sortedItems = [...navigationItems].sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1
    if (!a.isPopular && b.isPopular) return 1
    return a.title.localeCompare(b.title)
  })
  
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
    // In a real app, this would use Next.js router
    // router.push(path)
  }
  
  return (
    <WidgetContainer
      type="quick-navigation"
      title="Quick Navigation"
      description="Fast access to important pages"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Popular items section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Popular Pages</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {sortedItems
                  .filter(item => item.isPopular)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                {item.title}
                              </h3>
                              {item.badge && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* All items section */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">All Pages</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {sortedItems.map((item) => (
                  <div
                    key={`all-${item.id}`}
                    className="p-3 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleNavigate(item.path)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <div>
                          <div className="flex items-center space-x-1">
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                              {item.title}
                            </h3>
                            {item.badge && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom navigation */}
            <div className="pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleNavigate("/settings/navigation")}
              >
                <Settings className="h-3 w-3 mr-1" />
                Customize Navigation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}