"use client";

import { CalendarDays, Home, PanelLeft, Plus, Shield, Users } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarUser,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DemoNavItem = {
  id: string;
  title: string;
  icon: typeof Home;
  isActive?: boolean;
};

const NAV_GROUPS: ReadonlyArray<{ label: string; items: ReadonlyArray<DemoNavItem> }> = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", title: "Dashboard", icon: Home },
      { id: "events", title: "Events", icon: CalendarDays },
    ],
  },
  {
    label: "Members",
    items: [
      { id: "directory", title: "Directory", icon: Users, isActive: true },
      { id: "roles", title: "Roles", icon: Shield },
    ],
  },
];

/**
 * Miniature backoffice shell built on the dashboard sidebar primitives.
 *
 * The full `Sidebar` shell component positions itself fixed against the
 * viewport, so inside this fixed-height frame we reuse the provider and the
 * menu primitives on a local rail that animates its width between
 * --sidebar-width and --sidebar-width-icon instead.
 */
export function AppShellDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backoffice shell</CardTitle>
        <CardDescription>
          The dashboard layout in miniature: collapsible sidebar, breadcrumb top bar, and page
          header with actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-[420px] overflow-hidden rounded-xl border">
          <SidebarProvider className="h-full min-h-0">
            <DemoShell />
          </SidebarProvider>
        </div>
        <p className="text-muted-foreground text-xs">
          Demonstrates the backoffice shell pattern, not live navigation. Every entry is demo data
          and routes nowhere, and Cmd or Ctrl plus B toggles the rail too.
        </p>
      </CardContent>
    </Card>
  );
}

function DemoShell() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside
        data-state={state}
        data-collapsible={collapsed ? "icon" : ""}
        data-side="left"
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border group flex shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-linear",
          collapsed ? "w-(--sidebar-width-icon)" : "w-(--sidebar-width)",
        )}
      >
        <SidebarHeader className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Nuvia backoffice">
                <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                  N
                </span>
                <span className="font-semibold">Nuvia</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={item.isActive}
                      className="data-[active=true]:bg-secondary data-[active=true]:text-secondary-foreground"
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarUser user={{ name: "Demo admin", email: "admin@example.com" }} />
        </SidebarFooter>
      </aside>

      <div className="bg-background flex min-w-0 flex-1 flex-col">
        <header className="border-border/60 bg-background/95 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setOpen(!collapsed)}
          >
            <PanelLeft aria-hidden="true" />
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Members
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">Directory</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight">Member directory</h3>
            <p className="text-muted-foreground text-sm">
              Search, filter, and manage association members.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">
              <Plus aria-hidden="true" />
              Invite member
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-hidden p-4">
          <Skeleton className="h-8 w-full max-w-sm" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
