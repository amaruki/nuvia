"use client";

import { useEffect, useState } from "react";
import { useHeader } from "@/contexts/dashboard-context";

import type { TabId } from "./calendar-tabs";

export function useEventsCalendar() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { setHeader, clearHeader } = useHeader();

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    setHeader({
      title: "Events Calendar",
      description: "Manage and monitor community events and activities",
    });
    setIsLoading(false);

    // Cleanup header on unmount
    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return {
    activeTab,
    setActiveTab,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    selectedDate,
    handleDateClick,
  };
}
