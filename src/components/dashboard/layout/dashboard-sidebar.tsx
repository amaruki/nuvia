"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  SidebarSeparator,
  SidebarSearch,
  SidebarTrigger,
  SidebarUser,
  SidebarNotificationBadge,
  useSidebar,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Shield,
  TrendingUp,
  DollarSign,
  BarChart3,
  User,
  Smartphone,
  Activity,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Star,
  Heart,
  Award,
  CreditCard,
  FileSpreadsheet,
  Megaphone,
  Users2,
  Building2,
  Mail,
  CalendarCheck,
  ChartLine,
  Wallet,
  Receipt,
  Calculator,
  PieChart,
  BarChart,
  LineChart,
  Target,
  Gauge,
  Database,
  Cog,
  UserCircle,
  Lock,
  Globe,
  Palette,
  BellRing,
  HelpCircle,
  Info,
} from "lucide-react";
import { UserRole } from "@/types/dashboard.types";

interface DashboardSidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  role?: UserRole;
  className?: string;
}

interface NavItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | null;
  roles?: UserRole[];
  isSeparator?: boolean;
  category?: string;
  subItems?: NavItem[];
}

export function DashboardSidebar({
  user,
  role = "member",
  className,
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, toggleSidebar, isMobile, setActiveItem } = useSidebar();

  // Navigation items configuration with AMS-specific structure
  const navigationItems: NavItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Overview and analytics",
      icon: <Home className="h-5 w-5" />,
      path: "/dashboard",
      category: "main",
    },
    {
      id: "members",
      title: "Members",
      description: "Manage association members",
      icon: <Users className="h-5 w-5" />,
      path: "/members",
      category: "main",
      roles: ["admin", "moderator"],
      subItems: [
        {
          id: "member-directory",
          title: "Member Directory",
          description: "Browse all members",
          icon: <Users2 className="h-4 w-4" />,
          path: "/members/directory",
        },
        {
          id: "member-requests",
          title: "Membership Requests",
          description: "Review new applications",
          icon: <UserCircle className="h-4 w-4" />,
          path: "/members/requests",
          badge: "3",
        },
        {
          id: "member-types",
          title: "Membership Types",
          description: "Manage membership categories",
          icon: <Building2 className="h-4 w-4" />,
          path: "/members/types",
        },
      ],
    },
    {
      id: "events",
      title: "Events",
      description: "Manage events and activities",
      icon: <Calendar className="h-5 w-5" />,
      path: "/events",
      category: "main",
      badge: "2",
      subItems: [
        {
          id: "event-calendar",
          title: "Event Calendar",
          description: "View all events",
          icon: <CalendarCheck className="h-4 w-4" />,
          path: "/events/calendar",
        },
        {
          id: "create-event",
          title: "Create Event",
          description: "Schedule new event",
          icon: <Plus className="h-4 w-4" />,
          path: "/events/create",
        },
        {
          id: "event-registrations",
          title: "Registrations",
          description: "Manage event signups",
          icon: <Users className="h-4 w-4" />,
          path: "/events/registrations",
        },
      ],
    },
    {
      id: "communications",
      title: "Communications",
      description: "Announcements and messaging",
      icon: <Megaphone className="h-5 w-5" />,
      path: "/communications",
      category: "main",
      subItems: [
        {
          id: "announcements",
          title: "Announcements",
          description: "Create and manage announcements",
          icon: <BellRing className="h-4 w-4" />,
          path: "/communications/announcements",
        },
        {
          id: "newsletters",
          title: "Newsletters",
          description: "Manage newsletter campaigns",
          icon: <Mail className="h-4 w-4" />,
          path: "/communications/newsletters",
        },
        {
          id: "notifications",
          title: "Notifications",
          description: "System notifications",
          icon: <Bell className="h-4 w-4" />,
          path: "/communications/notifications",
          badge: "5",
        },
      ],
    },
    {
      id: "finance",
      title: "Finance",
      description: "Financial management",
      icon: <DollarSign className="h-5 w-5" />,
      path: "/finance",
      category: "main",
      roles: ["admin", "moderator"],
      subItems: [
        {
          id: "dues-management",
          title: "Dues Management",
          description: "Track membership fees",
          icon: <CreditCard className="h-4 w-4" />,
          path: "/finance/dues",
        },
        {
          id: "budgeting",
          title: "Budgeting",
          description: "Manage association budget",
          icon: <Calculator className="h-4 w-4" />,
          path: "/finance/budget",
        },
        {
          id: "expenses",
          title: "Expenses",
          description: "Track and approve expenses",
          icon: <Receipt className="h-4 w-4" />,
          path: "/finance/expenses",
        },
        {
          id: "revenue",
          title: "Revenue",
          description: "Income and revenue tracking",
          icon: <Wallet className="h-4 w-4" />,
          path: "/finance/revenue",
        },
      ],
    },
    {
      id: "reports",
      title: "Reports",
      description: "Analytics and reporting",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/reports",
      category: "main",
      roles: ["admin", "moderator"],
      subItems: [
        {
          id: "member-analytics",
          title: "Member Analytics",
          description: "Membership statistics",
          icon: <Users2 className="h-4 w-4" />,
          path: "/reports/members",
        },
        {
          id: "financial-reports",
          title: "Financial Reports",
          description: "Financial statements",
          icon: <FileSpreadsheet className="h-4 w-4" />,
          path: "/reports/financial",
        },
        {
          id: "event-reports",
          title: "Event Reports",
          description: "Event participation metrics",
          icon: <ChartLine className="h-4 w-4" />,
          path: "/reports/events",
        },
        {
          id: "custom-reports",
          title: "Custom Reports",
          description: "Build custom analytics",
          icon: <PieChart className="h-4 w-4" />,
          path: "/reports/custom",
        },
      ],
    },
    {
      id: "main-separator",
      isSeparator: true,
      title: "",
      description: "",
      icon: null,
      path: "",
    },
    {
      id: "profile",
      title: "My Profile",
      description: "Manage your profile",
      icon: <User className="h-5 w-5" />,
      path: "/profile",
      category: "personal",
    },
    {
      id: "my-events",
      title: "My Events",
      description: "Events you're attending",
      icon: <CalendarCheck className="h-5 w-5" />,
      path: "/my-events",
      category: "personal",
      badge: "1",
    },
    {
      id: "my-certificates",
      title: "Certificates",
      description: "Your achievements",
      icon: <Award className="h-5 w-5" />,
      path: "/certificates",
      category: "personal",
    },
    {
      id: "billing",
      title: "Billing",
      description: "Payment history",
      icon: <CreditCard className="h-5 w-5" />,
      path: "/billing",
      category: "personal",
    },
    {
      id: "personal-separator",
      isSeparator: true,
      title: "",
      description: "",
      icon: null,
      path: "",
    },
    {
      id: "active-devices",
      title: "Active Devices",
      description: "Manage your sessions",
      icon: <Smartphone className="h-5 w-5" />,
      path: "/dashboard/active-devices",
      category: "system",
    },
    {
      id: "login-activities",
      title: "Login Activities",
      description: "Account security",
      icon: <Activity className="h-5 w-5" />,
      path: "/dashboard/login-activities",
      category: "system",
    },
    {
      id: "admin-separator",
      isSeparator: true,
      title: "",
      description: "",
      icon: null,
      path: "",
      roles: ["admin", "moderator"],
    },
    {
      id: "moderation",
      title: "Moderation",
      description: "Content moderation",
      icon: <Shield className="h-5 w-5" />,
      path: "/moderation",
      category: "admin",
      roles: ["admin", "moderator"],
    },
    {
      id: "system-settings",
      title: "System Settings",
      description: "Configure system",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings/system",
      category: "admin",
      roles: ["admin"],
    },
    {
      id: "settings-separator",
      isSeparator: true,
      title: "",
      description: "",
      icon: null,
      path: "",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Preferences",
      icon: <Cog className="h-5 w-5" />,
      path: "/settings",
      category: "system",
    },
  ];

  // Filter items based on user role
  const filteredItems = navigationItems.filter((item) => {
    if (item.isSeparator) return true;
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const handleNavigate = (path: string, id: string) => {
    if (path) {
      router.push(path);
      if (setActiveItem) {
        setActiveItem(id);
      }
      // Close mobile menu after navigation
      if (isMobile) {
        window.dispatchEvent(new CustomEvent("close-mobile-menu"));
      }
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (item.isSeparator) {
      if (!acc.separators) acc.separators = [];
      acc.separators.push(item);
    } else {
      const category = item.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
    }
    return acc;
  }, {} as Record<string, NavItem[]> & { separators?: NavItem[] });

  return (
    <Sidebar className={cn(
      "bg-card border-r border-border/50 backdrop-blur-sm transition-all duration-300",
      "shadow-lg hover:shadow-xl",
      className
    )}>
        {/* Enhanced Header */}
        <SidebarHeader className="border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            {(state !== "collapsed" || isMobile) && (
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <TrendingUp className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                </div>
                <div>
                  <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Nuvia
                  </span>
                  <p className="text-xs text-muted-foreground">AMS Platform</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              {isMobile ? (
                <Button
                              variant="default"
                  size="icon"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("close-mobile-menu"));
                  }}
                  className="md:hidden h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <SidebarTrigger className="h-8 w-8" />
              )}
            </div>
          </div>
          
          {/* Enhanced Search */}
          {state !== "collapsed" && (
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search anything..."
                className="w-full h-9 rounded-lg bg-muted/50 border border-border/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/60"
              />
            </div>
          )}
        </SidebarHeader>

        {/* Enhanced Content */}
        <SidebarContent className="p-2">
          {/* Main Navigation */}
          {groupedItems.main && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                Main Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupedItems.main.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        id={item.id}
                        isActive={isActive(item.path)}
                        variant="dashboard"
                        size="dashboard"
                        tooltip={item.title}
                        onClick={() => handleNavigate(item.path, item.id)}
                        className={cn(
                          "group relative overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
                          "hover:before:opacity-100",
                          isActive(item.path) && "bg-primary/10 text-primary shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200",
                          isActive(item.path) && "bg-primary/20 text-primary"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{item.title}</span>
                          {state !== "collapsed" && (
                            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.badge && (
                          <SidebarNotificationBadge
                            count={parseInt(item.badge)}
                            className="absolute top-2 right-2"
                          />
                        )}
                        {item.subItems && (
                          <ChevronRight className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            isActive(item.path) && "rotate-90 text-primary"
                          )} />
                        )}
                      </SidebarMenuButton>
                      
                      {/* Sub-items */}
                      {item.subItems && state !== "collapsed" && isActive(item.path) && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuButton
                              key={subItem.id}
                              isActive={isActive(subItem.path)}
                              variant="default"
                              size="sm"
                              tooltip={subItem.title}
                              onClick={() => handleNavigate(subItem.path, subItem.id)}
                              className={cn(
                                "ml-4 h-8 text-sm",
                                isActive(subItem.path) && "bg-accent text-accent-foreground"
                              )}
                            >
                              {subItem.icon}
                              <span className="truncate">{subItem.title}</span>
                              {subItem.badge && (
                                <Badge variant="secondary" className="ml-auto text-xs h-5 px-2">
                                  {subItem.badge}
                                </Badge>
                              )}
                            </SidebarMenuButton>
                          ))}
                        </div>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Personal Section */}
          {groupedItems.personal && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                Personal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupedItems.personal.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        id={item.id}
                        isActive={isActive(item.path)}
                        variant="dashboard"
                        size="dashboard"
                        tooltip={item.title}
                        onClick={() => handleNavigate(item.path, item.id)}
                        className={cn(
                          "group relative overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
                          "hover:before:opacity-100",
                          isActive(item.path) && "bg-primary/10 text-primary shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200",
                          isActive(item.path) && "bg-primary/20 text-primary"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{item.title}</span>
                          {state !== "collapsed" && (
                            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.badge && (
                          <SidebarNotificationBadge
                            count={parseInt(item.badge)}
                            className="absolute top-2 right-2"
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Admin Section */}
          {groupedItems.admin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                Administration
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupedItems.admin.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        id={item.id}
                        isActive={isActive(item.path)}
                        variant="dashboard"
                        size="dashboard"
                        tooltip={item.title}
                        onClick={() => handleNavigate(item.path, item.id)}
                        className={cn(
                          "group relative overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-destructive/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
                          "hover:before:opacity-100",
                          isActive(item.path) && "bg-destructive/10 text-destructive shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-destructive/10 transition-colors duration-200",
                          isActive(item.path) && "bg-destructive/20 text-destructive"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{item.title}</span>
                          {state !== "collapsed" && (
                            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* System Section */}
          {groupedItems.system && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupedItems.system.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        id={item.id}
                        isActive={isActive(item.path)}
                        variant="dashboard"
                        size="dashboard"
                        tooltip={item.title}
                        onClick={() => handleNavigate(item.path, item.id)}
                        className={cn(
                          "group relative overflow-hidden",
                          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
                          "hover:before:opacity-100",
                          isActive(item.path) && "bg-primary/10 text-primary shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200",
                          isActive(item.path) && "bg-primary/20 text-primary"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{item.title}</span>
                          {state !== "collapsed" && (
                            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {/* Enhanced Footer */}
        <SidebarFooter className="border-t border-border/50 p-4 space-y-3">
          {/* Theme Toggle */}
          {state !== "collapsed" && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Theme</span>
              </div>
              <DarkModeToggle />
            </div>
          )}
          
          {/* User Profile */}
          <SidebarUser 
            user={user} 
            className={cn(
              "rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200",
              state === "collapsed" && "justify-center"
            )} 
          />
        </SidebarFooter>
      </Sidebar>
  );
}
