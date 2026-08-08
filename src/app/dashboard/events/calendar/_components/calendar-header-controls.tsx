"use client";

import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Plus } from "lucide-react";

import { calendarTabs } from "./calendar-tabs";
import { EventDialog } from "./event-dialog";

interface CalendarHeaderControlsProps {
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

export function CalendarHeaderControls({
  isDialogOpen,
  onDialogOpenChange,
  selectedDate,
}: CalendarHeaderControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <TabsList className="grid w-full max-w-md grid-cols-4">
        {calendarTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <EventDialog
          open={isDialogOpen}
          onOpenChange={onDialogOpenChange}
          defaultDate={selectedDate}
        >
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </EventDialog>
      </div>
    </div>
  );
}
