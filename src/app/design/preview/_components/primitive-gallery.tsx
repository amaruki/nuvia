"use client";

import { AlertCircle, Info, Plus, Trash2, User } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const GALLERY_MONTH = new Date(2025, 5, 1); // Fixed demo month (June 2025)

const SCROLL_AREA_ITEMS = [
  "Opening remarks",
  "Welcome and introductions",
  "Committee updates",
  "Treasurer report",
  "Event calendar review",
  "Community feedback",
  "Closing notes",
];

export function PrimitiveGallery() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="icon" aria-label="Add item">
              <Plus aria-hidden="true" />
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled outline
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges and status mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">active</Badge>
            <Badge variant="outline">pending</Badge>
            <Badge variant="outline">inactive</Badge>
            <Badge variant="destructive">suspended</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Status colors come from badge variants, never from hardcoded palette classes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inputs and labels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gallery-input">Member name</Label>
            <Input id="gallery-input" placeholder="Dewi Kusuma" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gallery-disabled">Disabled</Label>
            <Input id="gallery-disabled" value="Read-only field" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Switch and skeleton</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch id="gallery-switch" defaultChecked />
            <Label htmlFor="gallery-switch">Public profile visible (opt-in, D7)</Label>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avatars</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar>
              <AvatarFallback>DK</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>SR</AvatarFallback>
            </Avatar>
            <Avatar className="size-12">
              <AvatarFallback className="text-base">BP</AvatarFallback>
            </Avatar>
          </div>
          <p className="text-muted-foreground text-xs">Initials render when no image is set.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dropdown menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuItem>
                <User aria-hidden="true" />
                Profile
                <DropdownMenuShortcut>Ctrl+Shift+P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Billing and plans</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 aria-hidden="true" />
                Delete workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Popover</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open settings</Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-4" align="start">
              <div className="space-y-1">
                <p className="text-sm font-medium">Notification settings</p>
                <p className="text-muted-foreground text-xs">Demo panel content.</p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="gallery-popover-email">Email notifications</Label>
                <Switch id="gallery-popover-email" defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="gallery-popover-digest">Weekly digest</Label>
                <Switch id="gallery-popover-digest" />
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Calendar mode="single" month={GALLERY_MONTH} className="rounded-lg border" />
          <p className="text-muted-foreground text-xs">Static view of a fixed demo month.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accordion</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="gallery-accordion-1">
            <AccordionItem value="gallery-accordion-1">
              <AccordionTrigger>What is this gallery for?</AccordionTrigger>
              <AccordionContent>Shared primitives keep screens consistent.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="gallery-accordion-2">
              <AccordionTrigger>When should I use a dialog instead of a sheet?</AccordionTrigger>
              <AccordionContent>Use dialogs for decisions, sheets for flows.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="gallery-accordion-3">
              <AccordionTrigger>Where do the colors come from?</AccordionTrigger>
              <AccordionContent>Surfaces use tokens, so both themes match.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info aria-hidden="true" />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>Neutral notices use the default variant.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Export failed</AlertTitle>
            <AlertDescription>Errors use the destructive variant.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Profile completion</span>
              <span className="text-muted-foreground">60%</span>
            </div>
            <Progress value={60} aria-label="Demo progress value" />
          </div>
          <p className="text-muted-foreground text-xs">Demo value; production binds live data.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Separator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm">Content above a horizontal separator.</p>
            <Separator />
            <p className="text-sm">Content below a horizontal separator.</p>
          </div>
          <div className="flex h-5 items-center gap-3 text-sm">
            <span>Profile</span>
            <Separator orientation="vertical" />
            <span>Settings</span>
            <Separator orientation="vertical" />
            <span>Sign out</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scroll area</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-40 rounded-lg border">
            <ul className="space-y-2 p-4">
              {SCROLL_AREA_ITEMS.map((item) => (
                <li key={item} className="text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </ScrollArea>
          <p className="text-muted-foreground text-xs">Demo list items in a fixed height area.</p>
        </CardContent>
      </Card>
    </div>
  );
}
