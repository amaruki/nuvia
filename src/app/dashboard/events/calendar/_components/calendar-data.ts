import type { CalendarEvent } from "@/components/ui/full-calendar";

export interface SampleEvent {
  id: number;
  title: string;
  date: Date;
  time: string;
  location: string;
}

// Sample events data
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

export const sampleEvents: SampleEvent[] = [
  {
    id: 1,
    title: "Community Meetup",
    date: new Date(2024, 11, 15),
    time: "6:00 PM",
    location: "Community Center",
  },
  {
    id: 2,
    title: "Tech Workshop",
    date: new Date(2024, 11, 22),
    time: "2:00 PM",
    location: "Tech Hub",
  },
  {
    id: 3,
    title: "Holiday Party",
    date: new Date(2024, 11, 25),
    time: "7:00 PM",
    location: "Main Hall",
  },
  {
    id: 4,
    title: "New Year Celebration",
    date: new Date(2025, 0, 1),
    time: "9:00 PM",
    location: "City Park",
  },
  {
    id: 5,
    title: "Morning Yoga",
    date: new Date(2024, 11, 15),
    time: "8:00 AM",
    location: "Wellness Center",
  },
  {
    id: 6,
    title: "Team Meeting",
    date: new Date(currentYear, currentMonth, 20),
    time: "10:00 AM",
    location: "Conference Room",
  },
  {
    id: 7,
    title: "Product Launch",
    date: new Date(currentYear, currentMonth, 25),
    time: "3:00 PM",
    location: "Main Auditorium",
  },
];

// Convert sample events to full-calendar format
export function convertEventsToCalendarFormat(): CalendarEvent[] {
  const eventColors = ["default", "blue", "green", "pink", "purple"] as const;

  return sampleEvents.map((event, index) => {
    // Parse time and create proper Date objects
    const eventDate = new Date(event.date);
    const time24h =
      event.time.includes("AM") || event.time.includes("PM")
        ? event.time.replace(" AM", "").replace(" PM", "")
        : event.time;

    let hours = parseInt(time24h.split(":")[0]);
    const minutes = parseInt(time24h.split(":")[1] || "0");

    if (event.time.includes("PM") && hours !== 12) {
      hours += 12;
    }
    if (event.time.includes("AM") && hours === 12) {
      hours = 0;
    }

    const startDate = new Date(eventDate);
    startDate.setHours(hours, minutes, 0, 0);

    // Create end date (2 hours after start for demo purposes)
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    return {
      id: event.id.toString(),
      start: startDate,
      end: endDate,
      title: event.title,
      color: eventColors[index % eventColors.length],
    };
  });
}
