"use client";

import { useState } from "react";
import { AlertTriangle, Archive, Bell, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function OverlayDemo() {
  const [title, setTitle] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dialog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus aria-hidden="true" />
                New announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish an announcement</DialogTitle>
                <DialogDescription>
                  Announcements belong to the content module (D11). This dialog only demonstrates
                  the overlay pattern.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="overlay-title">Title</Label>
                  <Input
                    id="overlay-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Annual general meeting"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overlay-body">Body</Label>
                  <Textarea id="overlay-body" rows={3} placeholder="Short summary..." />
                </div>
              </div>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogTrigger>
                <Button
                  onClick={() => {
                    toast.success(title ? `Published "${title}"` : "Published (demo)");
                    setTitle("");
                  }}
                >
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <p className="text-muted-foreground text-xs">
            Focus stays trapped inside while open, Escape closes, focus returns to the trigger.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert dialog (destructive confirm)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Archive aria-hidden="true" />
                Suspend member
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Suspend this member?</AlertDialogTitle>
                <AlertDialogDescription>
                  Their role syncs from the membership subscription (ADR-0014), so suspension takes
                  effect after the next sync. This action can be reversed from the audit log.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => toast("Member suspended (demo)")}>
                  Suspend
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-muted-foreground text-xs">
            Every destructive bulk action in the backoffice confirms through this pattern.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-muted-foreground pt-3 text-sm">
              Summary cards and the latest announcement sit here on real pages.
            </TabsContent>
            <TabsContent value="activity" className="text-muted-foreground pt-3 text-sm">
              Timeline of registrations, payments, and posts.
            </TabsContent>
            <TabsContent value="settings" className="text-muted-foreground pt-3 text-sm">
              Per-module settings forms, all built on the form standard (section 4).
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tooltip & sheet (motion tokens)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Notification settings">
                  <Bell aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notification settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Display options">
                  <Settings2 aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Display options</TooltipContent>
            </Tooltip>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open drawer</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Drawer</SheetTitle>
                  <SheetDescription>
                    Slides with the --ease-drawer token, 300ms open and 200ms close, and falls back
                    to a fade under prefers-reduced-motion (plans/001).
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-2 px-4">
                  <Badge variant="secondary">motion-safe slide</Badge>
                  <Badge variant="outline">opacity fallback</Badge>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Icon-only buttons always carry aria-label (UI-08).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
