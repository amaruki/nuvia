// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  users: {
    name: "User Management",
    description: "Manage user accounts and access",
    icon: "users",
    color: "blue",
  },
  events: {
    name: "Event Management",
    description: "Create and manage events",
    icon: "calendar",
    color: "purple",
  },
  memberships: {
    name: "Membership Management",
    description: "Manage member subscriptions and tiers",
    icon: "id-card",
    color: "green",
  },
  finance: {
    name: "Financial Management",
    description: "Handle payments and financial data",
    icon: "dollar-sign",
    color: "emerald",
  },
  content: {
    name: "Content Management",
    description: "Manage articles and publications",
    icon: "file-text",
    color: "orange",
  },
  communications: {
    name: "Communications",
    description: "Send announcements and newsletters",
    icon: "mail",
    color: "pink",
  },
  analytics: {
    name: "Analytics & Reports",
    description: "View analytics and generate reports",
    icon: "bar-chart",
    color: "indigo",
  },
  organization: {
    name: "Organization",
    description: "Manage organization settings",
    icon: "building",
    color: "slate",
  },
  forum: {
    name: "Forum Management",
    description: "Moderate discussions and forums",
    icon: "message-square",
    color: "cyan",
  },
  jobs: {
    name: "Job Board",
    description: "Manage job postings and applications",
    icon: "briefcase",
    color: "amber",
  },
  learning: {
    name: "Learning Management",
    description: "Manage courses and certifications",
    icon: "book-open",
    color: "rose",
  },
  chapters: {
    name: "Chapters",
    description: "Manage chapters and regional branches",
    icon: "map-pin",
    color: "teal",
  },
  committees: {
    name: "Committees",
    description: "Manage committees and working groups",
    icon: "users",
    color: "violet",
  },
  awards: {
    name: "Awards",
    description: "Manage award programs and recipients",
    icon: "award",
    color: "yellow",
  },
  workspaces: {
    name: "Workspaces",
    description: "Manage member workspaces and collaboration spaces",
    icon: "layers",
    color: "sky",
  },
  system: {
    name: "System Administration",
    description: "System-wide settings and configuration",
    icon: "settings",
    color: "red",
  },
} as const;
