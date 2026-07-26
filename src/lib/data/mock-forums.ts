import { UserRole } from "@/types/dashboard.types";

export type ForumCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  postCount: number;
  lastPostAt?: string;
  createdAt: string;
};

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  category: {
    id: string;
    name: string;
  };
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED" | "HIDDEN" | "PENDING_REVIEW";
  createdAt: string;
  reportCount: number;
};

export type Report = {
  id: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  reason: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  reportedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  targetContent?: {
    title?: string;
    content: string; // snippet
  };
};

export const MOCK_CATEGORIES: ForumCategory[] = [
  {
    id: "cat-1",
    name: "General Discussion",
    description: "General topics about the community and platform.",
    icon: "MessageSquare",
    color: "#3b82f6",
    postCount: 120,
    lastPostAt: "2024-03-20T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-2",
    name: "Announcements",
    description: "Official news and updates from the team.",
    icon: "Megaphone",
    color: "#ef4444",
    postCount: 45,
    lastPostAt: "2024-03-19T15:45:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-3",
    name: "Tips & Tricks",
    description: "Share your best practices and learn from others.",
    icon: "Lightbulb",
    color: "#eab308",
    postCount: 89,
    lastPostAt: "2024-03-21T09:15:00Z",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "cat-4",
    name: "Product Feedback",
    description: "Help us improve Nuvia with your suggestions.",
    icon: "ClipboardList",
    color: "#10b981",
    postCount: 204,
    lastPostAt: "2024-03-21T11:20:00Z",
    createdAt: "2024-01-20T00:00:00Z",
  },
];

export const MOCK_MODERATION_QUEUE: ForumPost[] = [
  {
    id: "post-101",
    title: "How do I hack the system?",
    content: "I want to know if there is a way to bypass the login screen...",
    author: {
      id: "user-99",
      name: "BadActor123",
      role: "member",
    },
    category: {
      id: "cat-3",
      name: "Tips & Tricks",
    },
    status: "PENDING_REVIEW",
    createdAt: "2024-03-21T12:00:00Z",
    reportCount: 0,
  },
  {
    id: "post-102",
    title: "Best resources for learning React",
    content: "Here is a list of great free resources I found...",
    author: {
      id: "user-45",
      name: "DevJane",
      role: "member_professional",
    },
    category: {
      id: "cat-1",
      name: "General Discussion",
    },
    status: "PENDING_REVIEW",
    createdAt: "2024-03-21T11:45:00Z",
    reportCount: 0,
  },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: "rep-1",
    targetId: "post-55",
    targetType: "POST",
    reason: "Spam",
    status: "PENDING",
    reportedBy: {
      id: "user-22",
      name: "VigilantUser",
    },
    createdAt: "2024-03-21T10:00:00Z",
    targetContent: {
      title: "Cheap meds!!",
      content: "Buy generic pills now at...",
    },
  },
  {
    id: "rep-2",
    targetId: "comm-88",
    targetType: "COMMENT",
    reason: "Harassment",
    status: "PENDING",
    reportedBy: {
      id: "user-33",
      name: "PeaceKeeper",
    },
    createdAt: "2024-03-20T16:30:00Z",
    targetContent: {
      content: "You don't know what you're talking about, idiot.",
    },
  },
];

// Mock API Functions (Simulating async delays)
export const getMockCategories = async (): Promise<ForumCategory[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_CATEGORIES];
};

export const getMockModerationQueue = async (): Promise<ForumPost[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [...MOCK_MODERATION_QUEUE];
};

export const getMockReports = async (): Promise<Report[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_REPORTS];
};
