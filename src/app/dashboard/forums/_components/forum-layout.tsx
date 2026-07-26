"use client";

import React from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { cn } from "@/lib/utils";
import { MessageSquare, Shield, Flag, Layers, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ForumLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  total?: number;
  showTabs?: boolean;
}

export function ForumLayout({
  children,
  title = "Forums & Discussions",
  description = "Manage community discussions, categories, and moderation.",
  actions,
  total,
  showTabs = true,
}: ForumLayoutProps) {
  const { setHeader } = useHeader();
  const pathname = usePathname();

  React.useEffect(() => {
    setHeader({
      title,
      description,
    });
  }, [setHeader, title, description]);

  const tabs = [
    {
      label: "Categories",
      href: "/dashboard/forums/categories",
      icon: Layers,
      isActive: pathname === "/dashboard/forums/categories",
      count: 4,
    },
    {
      label: "Moderation Queue",
      href: "/dashboard/forums/moderation",
      icon: Shield,
      isActive: pathname === "/dashboard/forums/moderation",
      count: 2,
    },
    {
      label: "User Reports",
      href: "/dashboard/forums/reports",
      icon: Flag,
      isActive: pathname === "/dashboard/forums/reports",
      count: 3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          {/* Total Count Display */}
          {total !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <MessageSquare className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-lg font-semibold leading-none">{total.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Actions - Desktop */}
          {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}

          {/* Actions - Mobile */}
          {actions && (
            <div className="flex md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {React.Children.toArray(actions).map((child, index) => (
                    <DropdownMenuItem key={`action-${index}`}>{child}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Enhanced Internal Navigation Tabs */}
        {showTabs && (
          <div className="border-b">
            <nav className="flex space-x-1 overflow-x-auto" aria-label="Forum tabs">
              {tabs.map((tab) => (
                <Link key={tab.label} href={tab.href} className="flex-shrink-0">
                  <Button
                    variant={tab.isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2 h-10 rounded-none border-b-2 border-transparent px-4 font-medium text-muted-foreground hover:text-foreground transition-all",
                      tab.isActive && "border-primary text-primary hover:text-primary bg-accent/20",
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge
                        variant={tab.isActive ? "default" : "secondary"}
                        className="ml-1 h-5 px-1.5 text-xs font-medium"
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[calc(100vh-16rem)]">{children}</div>
    </div>
  );
}
