"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Bell,
  ChevronRight,
  CreditCard,
  Megaphone,
  Mail,
  CalendarCheck,
  Wallet,
  Shield,
  User,
  Smartphone,
  Activity,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  PieChart,
  Cog,
  UserCircle,
  BellRing,
  Palette,
  Search,
  Plus,
  ChevronsUpDown,
  BadgeCheck,
  LogOut,
} from "lucide-react";
import { UserRole } from "@/types/dashboard.types";

interface DashboardSidebarProps {
  readonly user?: {
    readonly name: string;
    readonly email: string;
    readonly avatar?: string;
  };
  readonly role?: UserRole;
  readonly className?: string;
}

interface NavigationItem {
  readonly id: string;
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly path: string;
  readonly badge?: string | null;
  readonly roles?: UserRole[];
  readonly category?: "main" | "personal" | "admin" | "system";
  readonly subItems?: readonly NavigationItem[];
  readonly isActive?: boolean;
}

export function DashboardSidebar({
  user = {
    name: "User",
    email: "user@example.com",
    avatar: "",
  },
  role = "member",
  className,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  const isCollapsed = state === "collapsed";

  // Navigation configuration
  const navigationConfig: readonly NavigationItem[] = [
    // Main Navigation
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <Home className="h-4 w-4" />,
      path: "/dashboard",
      category: "main",
    },
    {
      id: "members",
      title: "Members",
      icon: <Users className="h-4 w-4" />,
      path: "/members",
      category: "main",
      roles: ["admin", "moderator"],
      subItems: [
        {
          id: "member-directory",
          title: "Directory",
          icon: <Users className="h-4 w-4" />,
          path: "/members/directory",
        },
        {
          id: "member-requests",
          title: "Requests",
          icon: <UserCircle className="h-4 w-4" />,
          path: "/members/requests",
          badge: "3",
        },
        {
          id: "member-types",
          title: "Types",
          icon: <Shield className="h-4 w-4" />,
          path: "/members/types",
        },
      ] as const,
    },
    {
      id: "events",
      title: "Events",
      icon: <Calendar className="h-4 w-4" />,
      path: "/events",
      category: "main",
      badge: "2",
      subItems: [
        {
          id: "event-calendar",
          title: "Calendar",
          icon: <CalendarCheck className="h-4 w-4" />,
          path: "/events/calendar",
        },
        {
          id: "create-event",
          title: "Create",
          icon: <Plus className="h-4 w-4" />,
          path: "/events/create",
        },
        {
          id: "event-registrations",
          title: "Registrations",
          icon: <Users className="h-4 w-4" />,
          path: "/events/registrations",
        },
      ] as const,
    },
    {
      id: "communications",
      title: "Communications",
      icon: <Megaphone className="h-4 w-4" />,
      path: "/communications",
      category: "main",
      subItems: [
        {
          id: "announcements",
          title: "Announcements",
          icon: <BellRing className="h-4 w-4" />,
          path: "/communications/announcements",
        },
        {
          id: "newsletters",
          title: "Newsletters",
          icon: <Mail className="h-4 w-4" />,
          path: "/communications/newsletters",
        },
        {
          id: "notifications",
          title: "Notifications",
          icon: <Bell className="h-4 w-4" />,
          path: "/communications/notifications",
          badge: "5",
        },
      ] as const,
    },
    {
      id: "finance",
      title: "Finance",
      icon: <DollarSign className="h-4 w-4" />,
      path: "/finance",
      category: "main",
      roles: ["admin", "moderator"],
      subItems: [
        {
          id: "dues-management",
          title: "Dues",
          icon: <CreditCard className="h-4 w-4" />,
          path: "/finance/dues",
        },
        {
          id: "budgeting",
          title: "Budget",
          icon: <Wallet className="h-4 w-4" />,
          path: "/finance/budget",
        },
        {
          id: "revenue",
          title: "Revenue",
          icon: <TrendingUp className="h-4 w-4" />,
          path: "/finance/revenue",
        },
      ] as const,
    },
    {
      id: "reports",
      title: "Reports",
      icon: <BarChart3 className="h-4 w-4" />,
      path: "/reports",
      category: "main",
      roles: ["admin", "moderator"],
      subItems: [
        {
          id: "member-analytics",
          title: "Members",
          icon: <Users className="h-4 w-4" />,
          path: "/reports/members",
        },
        {
          id: "financial-reports",
          title: "Financial",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          path: "/reports/financial",
        },
        {
          id: "event-reports",
          title: "Events",
          icon: <Calendar className="h-4 w-4" />,
          path: "/reports/events",
        },
        {
          id: "custom-reports",
          title: "Custom",
          icon: <PieChart className="h-4 w-4" />,
          path: "/reports/custom",
        },
      ] as const,
    },

    // Personal Section
    {
      id: "profile",
      title: "Profile",
      icon: <User className="h-4 w-4" />,
      path: "/profile",
      category: "personal",
    },
    {
      id: "my-events",
      title: "My Events",
      icon: <CalendarCheck className="h-4 w-4" />,
      path: "/my-events",
      category: "personal",
      badge: "1",
    },
    {
      id: "billing",
      title: "Billing",
      icon: <CreditCard className="h-4 w-4" />,
      path: "/billing",
      category: "personal",
    },

    // System Section
    {
      id: "active-devices",
      title: "Devices",
      icon: <Smartphone className="h-4 w-4" />,
      path: "/dashboard/active-devices",
      category: "system",
    },
    {
      id: "login-activities",
      title: "Activity",
      icon: <Activity className="h-4 w-4" />,
      path: "/dashboard/login-activities",
      category: "system",
    },

    // Admin Section
    {
      id: "moderation",
      title: "Moderation",
      icon: <Shield className="h-4 w-4" />,
      path: "/moderation",
      category: "admin",
      roles: ["admin", "moderator"],
    },
    {
      id: "system-settings",
      title: "System",
      icon: <Settings className="h-4 w-4" />,
      path: "/settings/system",
      category: "admin",
      roles: ["admin"],
    },
    {
      id: "settings",
      title: "Settings",
      icon: <Cog className="h-4 w-4" />,
      path: "/settings",
      category: "system",
    },
  ] as const;

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationConfig.filter((item) => {
    return !item.roles || item.roles.includes(role);
  });

  // Group items by category
  const navigationGroups = filteredNavigationItems.reduce(
    (groups, item) => {
      const category = item.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, NavigationItem[]>
  );

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isPathActive = (path: string): boolean => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isPathActive(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (hasSubItems) {
      return (
        <Collapsible key={item.id} asChild defaultOpen={isActive}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton 
                tooltip={item.title} 
                isActive={isActive}
                className="group/item relative"
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold",
                        "flex items-center justify-center",
                        "bg-primary text-primary-foreground border-0",
                        "shadow-sm",
                        "opacity-0 scale-0 transition-all duration-200",
                        "group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:scale-100"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-200">
                  {item.title}
                </span>
                <div className="ml-auto flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 px-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
              <SidebarMenuSub>
                {item.subItems!.map((subItem) => {
                  const isSubActive = isPathActive(subItem.path);
                  return (
                    <SidebarMenuSubItem key={subItem.id}>
                      <SidebarMenuSubButton asChild isActive={isSubActive}>
                        <a
                          href={subItem.path}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigation(subItem.path);
                          }}
                          className="relative"
                        >
                          <span>{subItem.title}</span>
                          {subItem.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20"
                            >
                              {subItem.badge}
                            </Badge>
                          )}
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isActive}
          onClick={() => handleNavigation(item.path)}
          className="group/item relative"
        >
          <div className="relative flex items-center justify-center">
            {item.icon}
            {item.badge && (
              <Badge
                variant="secondary"
                className={cn(
                  "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold",
                  "flex items-center justify-center",
                  "bg-primary text-primary-foreground border-0",
                  "shadow-sm",
                  "opacity-0 scale-0 transition-all duration-200",
                  "group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:scale-100"
                )}
              >
                {item.badge}
              </Badge>
            )}
          </div>
          <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-200">
            {item.title}
          </span>
          {item.badge && (
            <Badge
              variant="secondary"
              className={cn(
                "ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold",
                "bg-primary/10 text-primary border-primary/20",
                "group-data-[collapsible=icon]:hidden",
                "transition-all duration-200"
              )}
            >
              {item.badge}
            </Badge>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderNavigationGroup = (category: string, title: string) => {
    const items = navigationGroups[category];
    if (!items || items.length === 0) return null;

    return (
      <SidebarGroup key={category}>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0 transition-opacity duration-200">
          {title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{items.map(renderNavigationItem)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className={className}>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:px-2"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-all group-data-[collapsible=icon]:size-8">
                <TrendingUp className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-200 overflow-hidden">
                <span className="truncate font-semibold">Nuvia</span>
                <span className="truncate text-xs">AMS Platform</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {renderNavigationGroup("main", "Navigation")}
        {renderNavigationGroup("personal", "Personal")}
        {renderNavigationGroup("admin", "Admin")}
        {renderNavigationGroup("system", "System")}
      </SidebarContent>

      <SidebarRail />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:px-2"
                >
                  <Avatar className="size-8 rounded-lg group-data-[collapsible=icon]:size-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-200 overflow-hidden">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BadgeCheck className="mr-2 size-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 size-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}