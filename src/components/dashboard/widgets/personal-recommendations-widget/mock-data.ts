import type { Article, Event } from "@/types/dashboard.types";

// Mock recommended articles data - in a real app, this would come from an API
export const mockRecommendedArticles: Article[] = [
  {
    id: "1",
    title: "Advanced React Patterns",
    excerpt: "Learn advanced React patterns and techniques to build scalable applications.",
    author: "Jane Smith",
    publishedAt: new Date("2023-09-28T10:30:00"),
    category: "Development",
    readTime: 8,
    isBookmarked: false,
  },
  {
    id: "2",
    title: "CSS Grid Layout Masterclass",
    excerpt: "Master CSS Grid Layout with practical examples and use cases.",
    author: "John Doe",
    publishedAt: new Date("2023-09-25T14:15:00"),
    category: "Design",
    readTime: 6,
    isBookmarked: true,
  },
];

// Mock recommended events data - in a real app, this would come from an API
export const mockRecommendedEvents: Event[] = [
  {
    id: "1",
    title: "JavaScript Frameworks Comparison",
    description: "A comprehensive comparison of popular JavaScript frameworks.",
    startDate: new Date("2023-10-10T10:00:00"),
    endDate: new Date("2023-10-10T12:00:00"),
    location: "Online (Zoom)",
    isRegistered: false,
    isCheckedIn: false,
  },
  {
    id: "2",
    title: "UI/UX Design Workshop",
    description: "Learn the fundamentals of UI/UX design in this hands-on workshop.",
    startDate: new Date("2023-10-15T09:00:00"),
    endDate: new Date("2023-10-15T13:00:00"),
    location: "Design Studio",
    isRegistered: true,
    isCheckedIn: false,
  },
];
