"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Edit, Power, PowerOff } from "lucide-react";
import type { ChapterDetailsModalProps } from "./types";
import OverviewTab from "./overview-tab";
import LeadershipTab from "./leadership-tab";
import MetricsTab from "./metrics-tab";
import EventsTab from "./events-tab";
import FinancesTab from "./finances-tab";

export function ChapterDetailsModal({
  chapter,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
}: ChapterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!chapter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {chapter.displayName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(chapter)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onToggleStatus(chapter, chapter.status === "active" ? "inactive" : "active")
              }
            >
              {chapter.status === "active" ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>

          <OverviewTab chapter={chapter} />
          <LeadershipTab chapter={chapter} />
          <MetricsTab chapter={chapter} />
          <EventsTab chapter={chapter} />
          <FinancesTab chapter={chapter} />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
