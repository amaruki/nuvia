"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Settings,
  User,
  ChevronsUpDown,
  LogOut,
  BadgeCheck,
  CreditCard,
  Command,
  Sun,
  Moon,
  Monitor,
  Palette,
  Layout,
  Shield,
  Globe,
  HelpCircle,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { NotificationsWidget } from "@/components/dashboard/widgets/notifications-widget";
import { Notification } from "@/types/dashboard.types";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  actions?: React.ReactNode;
  className?: string;
  notificationCount?: number;
  showSearch?: boolean;
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  onViewAllNotifications?: () => void;
}

export function DashboardHeader({
  title,
  description,
  breadcrumbs,
  user,
  actions,
  className,
  notificationCount = 0,
  showSearch = true,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onViewAllNotifications,
}: DashboardHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
        className,
      )}
    >
      <div className="flex w-full items-center gap-2 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        {/* Breadcrumbs or Title */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem className="hidden md:block">
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="font-semibold">{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={item.href || "#"}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : title ? (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          {showSearch && (
            <div className="relative hidden md:flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="h-9 w-64 pr-8"
                    autoFocus
                    onBlur={() => setIsSearchOpen(false)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 h-9 w-9"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              )}
            </div>
          )}

          {/* Command Menu - Mobile Search */}
          {showSearch && (
            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
              <Command className="h-4 w-4" />
              <span className="sr-only">Open command menu</span>
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] font-semibold flex items-center justify-center rounded-full"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <NotificationsWidget
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onDismiss={onDismiss}
                onViewAll={onViewAllNotifications}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Quick Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Quick Settings
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Theme Toggle */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                    <DropdownMenuRadioItem value="light">
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor className="mr-2 h-4 w-4" />
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Quick Links */}
              <DropdownMenuItem onClick={() => router.push("/dashboard/preferences")}>
                <Layout className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Preferences</span>
                  <span className="text-xs text-muted-foreground">Appearance & settings</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Profile</span>
                  <span className="text-xs text-muted-foreground">Account information</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push("/dashboard/settings/general")}>
                <Shield className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Settings</span>
                  <span className="text-xs text-muted-foreground">System configuration</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Help */}
              <DropdownMenuItem disabled>
                <HelpCircle className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Help & Support</span>
                  <span className="text-xs text-muted-foreground">Get assistance</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Additional actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
