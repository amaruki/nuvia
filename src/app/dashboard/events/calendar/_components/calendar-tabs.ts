import { Calendar as CalIcon, Clock, List, Users } from "lucide-react";

export const calendarTabs = [
  {
    id: "calendar",
    label: "Calendar",
    icon: CalIcon,
    description: "View events in calendar format",
  },
  {
    id: "list",
    label: "List View",
    icon: List,
    description: "View events as a list",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: Clock,
    description: "View upcoming events",
  },
  {
    id: "past",
    label: "Past Events",
    icon: Users,
    description: "View past events",
  },
] as const;

export type TabId = (typeof calendarTabs)[number]["id"];
