"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent } from "../../ui/card";
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
  ChevronRight,
} from "lucide-react";

interface QuickNavigationWidgetProps {
  onNavigate?: (path: string) => void;
}

// Static navigation targets. UI-01: the fabricated badges ("New", "3", "12",
// "5") were removed — there is no client-side count infrastructure to back
// them, so no badge is better than a made-up one.
const navigationItems = [
  {
    id: "1",
    title: "Dashboard",
    description: "Overview of your community activity",
    icon: <Home className="h-5 w-5 text-chart-1" />,
    path: "/dashboard",
    isPopular: true,
  },
  {
    id: "2",
    title: "Community",
    description: "Connect with other members",
    icon: <Users className="h-5 w-5 text-chart-2" />,
    path: "/community",
    isPopular: true,
  },
  {
    id: "3",
    title: "Events",
    description: "Upcoming and past events",
    icon: <Calendar className="h-5 w-5 text-chart-3" />,
    path: "/events",
    isPopular: true,
  },
  {
    id: "4",
    title: "Articles",
    description: "Latest articles and resources",
    icon: <FileText className="h-5 w-5 text-chart-4" />,
    path: "/articles",
    isPopular: false,
  },
  {
    id: "5",
    title: "Discussions",
    description: "Join conversations with the community",
    icon: <MessageSquare className="h-5 w-5 text-chart-5" />,
    path: "/discussions",
    isPopular: false,
  },
  {
    id: "6",
    title: "Certificates",
    description: "View and download your certificates",
    icon: <BookOpen className="h-5 w-5 text-chart-1" />,
    path: "/certificates",
    isPopular: false,
  },
  {
    id: "7",
    title: "Settings",
    description: "Manage your account preferences",
    icon: <Settings className="h-5 w-5 text-foreground/50" />,
    path: "/settings",
    isPopular: false,
  },
  {
    id: "8",
    title: "Notifications",
    description: "View your recent notifications",
    icon: <Bell className="h-5 w-5 text-destructive" />,
    path: "/notifications",
    isPopular: false,
  },
];

export function QuickNavigationWidget({ onNavigate }: QuickNavigationWidgetProps) {
  const router = useRouter();

  // Sort items: popular items first, then by title
  const sortedItems = [...navigationItems].sort((a, b) => {
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return a.title.localeCompare(b.title);
  });

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    router.push(path);
  };

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
                <Star className="h-4 w-4 text-chart-4" />
                <span className="text-sm font-medium text-foreground/70">Popular Pages</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {sortedItems
                  .filter((item) => item.isPopular)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border bg-card border-border hover:bg-background transition-colors cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNavigate(item.path)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNavigate(item.path);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <div>
                            <h3 className="text-sm font-semibold text-foreground/90">
                              {item.title}
                            </h3>
                            <p className="text-xs text-foreground/50 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-foreground/40" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* All items section */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                <span className="text-sm font-medium text-foreground/70">All Pages</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sortedItems.map((item) => (
                  <div
                    key={`all-${item.id}`}
                    className="p-3 rounded-lg border bg-card border-border hover:bg-background transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(item.path)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNavigate(item.path);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/90 line-clamp-1">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-foreground/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
