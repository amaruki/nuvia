import { 
  Chapter, 
  ChapterOverallStatistics, 
  ChapterFilterOptions,
  ChapterStatus,
  ChapterRole,
  ChapterPerformance,
  ChapterRegionalBreakdown
} from "@/types/chapter.types";

export const mockChapters: Chapter[] = [
  {
    id: "ch_1",
    name: "new_york_chapter",
    displayName: "New York Chapter",
    description: "The flagship chapter serving the New York metropolitan area with a focus on professional development and networking.",
    status: "active",
    location: {
      address: "123 Madison Avenue",
      city: "New York",
      state: "NY",
      country: "United States",
      postalCode: "10016",
      coordinates: {
        latitude: 40.7484,
        longitude: -73.9857
      },
      timezone: "America/New_York",
      region: "Northeast"
    },
    leadership: [
      {
        id: "lead_1",
        userId: "user_1",
        name: "Sarah Johnson",
        email: "sarah.johnson@nychapter.org",
        role: "president",
        title: "Chapter President",
        startDate: new Date("2023-01-15"),
        isActive: true,
        avatar: "/avatars/sarah.jpg",
        phone: "+1 (555) 123-4567"
      },
      {
        id: "lead_2",
        userId: "user_2",
        name: "Michael Chen",
        email: "michael.chen@nychapter.org",
        role: "vice_president",
        title: "Vice President",
        startDate: new Date("2023-03-01"),
        isActive: true,
        avatar: "/avatars/michael.jpg",
        phone: "+1 (555) 234-5678"
      },
      {
        id: "lead_3",
        userId: "user_3",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@nychapter.org",
        role: "treasurer",
        title: "Treasurer",
        startDate: new Date("2023-02-10"),
        isActive: true,
        avatar: "/avatars/emily.jpg",
        phone: "+1 (555) 345-6789"
      }
    ],
    memberCount: 245,
    establishedDate: new Date("2020-05-15"),
    subChapterIds: ["ch_1_1", "ch_1_2"],
    contactInfo: {
      email: "info@nychapter.org",
      phone: "+1 (555) 987-6543",
      website: "https://nychapter.org",
      address: "123 Madison Avenue, New York, NY 10016",
      mailingAddress: "PO Box 1234, New York, NY 10016"
    },
    socialMedia: {
      facebook: "https://facebook.com/nychapter",
      twitter: "https://twitter.com/nychapter",
      linkedin: "https://linkedin.com/company/nychapter",
      instagram: "https://instagram.com/nychapter"
    },
    metrics: {
      memberGrowthRate: 12.5,
      eventAttendanceRate: 78.3,
      financialHealth: "excellent",
      engagementScore: 85.2,
      retentionRate: 92.1,
      newMembersThisMonth: 8,
      activeMembersThisMonth: 189,
      monthlyTrend: [
        { month: "Nov 2025", memberCount: 245, eventCount: 4, attendanceRate: 78.3, revenue: 12450 },
        { month: "Oct 2025", memberCount: 237, eventCount: 3, attendanceRate: 75.2, revenue: 10200 },
        { month: "Sep 2025", memberCount: 230, eventCount: 5, attendanceRate: 82.1, revenue: 15600 }
      ]
    },
    events: [
      {
        id: "evt_1",
        title: "Annual Networking Gala",
        date: new Date("2025-12-15"),
        attendance: 180,
        revenue: 12450,
        status: "upcoming"
      },
      {
        id: "evt_2",
        title: "Professional Development Workshop",
        date: new Date("2025-11-20"),
        attendance: 65,
        revenue: 3250,
        status: "completed"
      }
    ],
    finances: {
      totalRevenue: 45600,
      totalExpenses: 32400,
      netIncome: 13200,
      budget: 50000,
      budgetUtilization: 91.2,
      monthlyRevenue: [
        { month: "Nov 2025", amount: 12450 },
        { month: "Oct 2025", amount: 10200 },
        { month: "Sep 2025", amount: 15600 }
      ],
      monthlyExpenses: [
        { month: "Nov 2025", amount: 8900 },
        { month: "Oct 2025", amount: 10500 },
        { month: "Sep 2025", amount: 7800 }
      ]
    },
    settings: {
      allowOnlineRegistration: true,
      requireApproval: false,
      membershipDues: 150,
      meetingFrequency: "monthly",
      meetingDay: "Third Thursday",
      meetingTime: "6:00 PM",
      autoRenewMembership: true,
      sendReminders: true,
      publicDirectory: true
    },
    createdAt: new Date("2020-05-15"),
    updatedAt: new Date("2025-11-28"),
    createdBy: "admin@example.com",
    updatedBy: "sarah.johnson@nychapter.org"
  },
  {
    id: "ch_2",
    name: "los_angeles_chapter",
    displayName: "Los Angeles Chapter",
    description: "Serving the greater Los Angeles area with focus on entertainment industry networking and tech innovation.",
    status: "active",
    location: {
      address: "456 Sunset Boulevard",
      city: "Los Angeles",
      state: "CA",
      country: "United States",
      postalCode: "90028",
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      },
      timezone: "America/Los_Angeles",
      region: "West"
    },
    leadership: [
      {
        id: "lead_4",
        userId: "user_4",
        name: "David Kim",
        email: "david.kim@lachapter.org",
        role: "president",
        title: "Chapter President",
        startDate: new Date("2023-06-01"),
        isActive: true,
        avatar: "/avatars/david.jpg",
        phone: "+1 (555) 456-7890"
      },
      {
        id: "lead_5",
        userId: "user_5",
        name: "Jessica Martinez",
        email: "jessica.martinez@lachapter.org",
        role: "secretary",
        title: "Chapter Secretary",
        startDate: new Date("2023-07-15"),
        isActive: true,
        avatar: "/avatars/jessica.jpg",
        phone: "+1 (555) 567-8901"
      }
    ],
    memberCount: 189,
    establishedDate: new Date("2021-03-20"),
    subChapterIds: ["ch_2_1"],
    contactInfo: {
      email: "info@lachapter.org",
      phone: "+1 (555) 876-5432",
      website: "https://lachapter.org",
      address: "456 Sunset Boulevard, Los Angeles, CA 90028"
    },
    socialMedia: {
      facebook: "https://facebook.com/lachapter",
      twitter: "https://twitter.com/lachapter",
      instagram: "https://instagram.com/lachapter"
    },
    metrics: {
      memberGrowthRate: 8.3,
      eventAttendanceRate: 72.5,
      financialHealth: "good",
      engagementScore: 78.9,
      retentionRate: 88.7,
      newMembersThisMonth: 5,
      activeMembersThisMonth: 137,
      monthlyTrend: [
        { month: "Nov 2025", memberCount: 189, eventCount: 3, attendanceRate: 72.5, revenue: 8900 },
        { month: "Oct 2025", memberCount: 184, eventCount: 4, attendanceRate: 68.3, revenue: 11200 },
        { month: "Sep 2025", memberCount: 180, eventCount: 2, attendanceRate: 75.1, revenue: 6700 }
      ]
    },
    events: [
      {
        id: "evt_3",
        title: "Tech Innovation Summit",
        date: new Date("2025-12-10"),
        attendance: 120,
        revenue: 8900,
        status: "upcoming"
      },
      {
        id: "evt_4",
        title: "Entertainment Industry Mixer",
        date: new Date("2025-11-15"),
        attendance: 85,
        revenue: 4200,
        status: "completed"
      }
    ],
    finances: {
      totalRevenue: 32400,
      totalExpenses: 28900,
      netIncome: 3500,
      budget: 40000,
      budgetUtilization: 81.0,
      monthlyRevenue: [
        { month: "Nov 2025", amount: 8900 },
        { month: "Oct 2025", amount: 11200 },
        { month: "Sep 2025", amount: 6700 }
      ],
      monthlyExpenses: [
        { month: "Nov 2025", amount: 7800 },
        { month: "Oct 2025", amount: 9200 },
        { month: "Sep 2025", amount: 6500 }
      ]
    },
    settings: {
      allowOnlineRegistration: true,
      requireApproval: true,
      membershipDues: 120,
      meetingFrequency: "biweekly",
      meetingDay: "First and Third Tuesday",
      meetingTime: "7:00 PM",
      autoRenewMembership: false,
      sendReminders: true,
      publicDirectory: true
    },
    createdAt: new Date("2021-03-20"),
    updatedAt: new Date("2025-11-25"),
    createdBy: "admin@example.com",
    updatedBy: "david.kim@lachapter.org"
  },
  {
    id: "ch_3",
    name: "chicago_chapter",
    displayName: "Chicago Chapter",
    description: "Midwest's premier chapter focusing on business development and community service initiatives.",
    status: "active",
    location: {
      address: "789 Michigan Avenue",
      city: "Chicago",
      state: "IL",
      country: "United States",
      postalCode: "60611",
      coordinates: {
        latitude: 41.8781,
        longitude: -87.6298
      },
      timezone: "America/Chicago",
      region: "Midwest"
    },
    leadership: [
      {
        id: "lead_6",
        userId: "user_6",
        name: "Robert Thompson",
        email: "robert.thompson@chichapter.org",
        role: "president",
        title: "Chapter President",
        startDate: new Date("2022-09-01"),
        isActive: true,
        avatar: "/avatars/robert.jpg",
        phone: "+1 (555) 678-9012"
      },
      {
        id: "lead_7",
        userId: "user_7",
        name: "Amanda Wilson",
        email: "amanda.wilson@chichapter.org",
        role: "treasurer",
        title: "Treasurer",
        startDate: new Date("2023-01-10"),
        isActive: true,
        avatar: "/avatars/amanda.jpg",
        phone: "+1 (555) 789-0123"
      }
    ],
    memberCount: 156,
    establishedDate: new Date("2020-11-10"),
    subChapterIds: [],
    contactInfo: {
      email: "info@chichapter.org",
      phone: "+1 (555) 765-4321",
      website: "https://chichapter.org",
      address: "789 Michigan Avenue, Chicago, IL 60611"
    },
    socialMedia: {
      facebook: "https://facebook.com/chichapter",
      linkedin: "https://linkedin.com/company/chichapter"
    },
    metrics: {
      memberGrowthRate: 5.2,
      eventAttendanceRate: 68.9,
      financialHealth: "good",
      engagementScore: 72.4,
      retentionRate: 85.3,
      newMembersThisMonth: 3,
      activeMembersThisMonth: 107,
      monthlyTrend: [
        { month: "Nov 2025", memberCount: 156, eventCount: 2, attendanceRate: 68.9, revenue: 5600 },
        { month: "Oct 2025", memberCount: 153, eventCount: 3, attendanceRate: 71.2, revenue: 7800 },
        { month: "Sep 2025", memberCount: 150, eventCount: 2, attendanceRate: 65.4, revenue: 5200 }
      ]
    },
    events: [
      {
        id: "evt_5",
        title: "Business Development Workshop",
        date: new Date("2025-12-05"),
        attendance: 75,
        revenue: 5600,
        status: "upcoming"
      },
      {
        id: "evt_6",
        title: "Community Service Day",
        date: new Date("2025-11-10"),
        attendance: 45,
        revenue: 0,
        status: "completed"
      }
    ],
    finances: {
      totalRevenue: 23400,
      totalExpenses: 19800,
      netIncome: 3600,
      budget: 30000,
      budgetUtilization: 78.0,
      monthlyRevenue: [
        { month: "Nov 2025", amount: 5600 },
        { month: "Oct 2025", amount: 7800 },
        { month: "Sep 2025", amount: 5200 }
      ],
      monthlyExpenses: [
        { month: "Nov 2025", amount: 5200 },
        { month: "Oct 2025", amount: 6800 },
        { month: "Sep 2025", amount: 4500 }
      ]
    },
    settings: {
      allowOnlineRegistration: true,
      requireApproval: false,
      membershipDues: 100,
      meetingFrequency: "monthly",
      meetingDay: "Second Wednesday",
      meetingTime: "6:30 PM",
      autoRenewMembership: true,
      sendReminders: true,
      publicDirectory: false
    },
    createdAt: new Date("2020-11-10"),
    updatedAt: new Date("2025-11-20"),
    createdBy: "admin@example.com",
    updatedBy: "robert.thompson@chichapter.org"
  },
  {
    id: "ch_4",
    name: "miami_chapter",
    displayName: "Miami Chapter",
    description: "Serving South Florida with focus on international business and cultural exchange.",
    status: "pending",
    location: {
      address: "321 Ocean Drive",
      city: "Miami",
      state: "FL",
      country: "United States",
      postalCode: "33139",
      coordinates: {
        latitude: 25.7617,
        longitude: -80.1918
      },
      timezone: "America/New_York",
      region: "Southeast"
    },
    leadership: [
      {
        id: "lead_8",
        userId: "user_8",
        name: "Carlos Rodriguez",
        email: "carlos.rodriguez@miamichapter.org",
        role: "president",
        title: "Chapter President",
        startDate: new Date("2025-01-15"),
        isActive: true,
        avatar: "/avatars/carlos.jpg",
        phone: "+1 (555) 890-1234"
      }
    ],
    memberCount: 45,
    establishedDate: new Date("2025-01-15"),
    subChapterIds: [],
    contactInfo: {
      email: "info@miamichapter.org",
      phone: "+1 (555) 654-3210",
      website: "https://miamichapter.org",
      address: "321 Ocean Drive, Miami, FL 33139"
    },
    socialMedia: {
      facebook: "https://facebook.com/miamichapter",
      instagram: "https://instagram.com/miamichapter"
    },
    metrics: {
      memberGrowthRate: 15.8,
      eventAttendanceRate: 62.3,
      financialHealth: "fair",
      engagementScore: 65.7,
      retentionRate: 78.9,
      newMembersThisMonth: 7,
      activeMembersThisMonth: 28,
      monthlyTrend: [
        { month: "Nov 2025", memberCount: 45, eventCount: 1, attendanceRate: 62.3, revenue: 1200 },
        { month: "Oct 2025", memberCount: 38, eventCount: 2, attendanceRate: 58.7, revenue: 2400 },
        { month: "Sep 2025", memberCount: 32, eventCount: 1, attendanceRate: 55.2, revenue: 800 }
      ]
    },
    events: [
      {
        id: "evt_7",
        title: "International Business Mixer",
        date: new Date("2025-12-20"),
        attendance: 30,
        revenue: 1200,
        status: "upcoming"
      }
    ],
    finances: {
      totalRevenue: 4400,
      totalExpenses: 5200,
      netIncome: -800,
      budget: 10000,
      budgetUtilization: 44.0,
      monthlyRevenue: [
        { month: "Nov 2025", amount: 1200 },
        { month: "Oct 2025", amount: 2400 },
        { month: "Sep 2025", amount: 800 }
      ],
      monthlyExpenses: [
        { month: "Nov 2025", amount: 1800 },
        { month: "Oct 2025", amount: 2200 },
        { month: "Sep 2025", amount: 1200 }
      ]
    },
    settings: {
      allowOnlineRegistration: true,
      requireApproval: true,
      membershipDues: 80,
      meetingFrequency: "monthly",
      meetingDay: "Fourth Thursday",
      meetingTime: "7:30 PM",
      autoRenewMembership: false,
      sendReminders: true,
      publicDirectory: true
    },
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-11-15"),
    createdBy: "admin@example.com",
    updatedBy: "carlos.rodriguez@miamichapter.org"
  },
  {
    id: "ch_5",
    name: "seattle_chapter",
    displayName: "Seattle Chapter",
    description: "Pacific Northwest chapter focusing on technology innovation and startup ecosystem.",
    status: "inactive",
    location: {
      address: "567 Pine Street",
      city: "Seattle",
      state: "WA",
      country: "United States",
      postalCode: "98101",
      coordinates: {
        latitude: 47.6062,
        longitude: -122.3321
      },
      timezone: "America/Los_Angeles",
      region: "West"
    },
    leadership: [],
    memberCount: 23,
    establishedDate: new Date("2021-07-22"),
    subChapterIds: [],
    contactInfo: {
      email: "info@seattlechapter.org",
      phone: "+1 (555) 543-2109",
      website: "https://seattlechapter.org",
      address: "567 Pine Street, Seattle, WA 98101"
    },
    socialMedia: {
      twitter: "https://twitter.com/seattlechapter",
      linkedin: "https://linkedin.com/company/seattlechapter"
    },
    metrics: {
      memberGrowthRate: -2.1,
      eventAttendanceRate: 45.6,
      financialHealth: "poor",
      engagementScore: 42.3,
      retentionRate: 65.2,
      newMembersThisMonth: 0,
      activeMembersThisMonth: 10,
      monthlyTrend: [
        { month: "Nov 2025", memberCount: 23, eventCount: 0, attendanceRate: 0, revenue: 0 },
        { month: "Oct 2025", memberCount: 24, eventCount: 1, attendanceRate: 45.6, revenue: 600 },
        { month: "Sep 2025", memberCount: 25, eventCount: 0, attendanceRate: 0, revenue: 0 }
      ]
    },
    events: [],
    finances: {
      totalRevenue: 1200,
      totalExpenses: 3400,
      netIncome: -2200,
      budget: 8000,
      budgetUtilization: 15.0,
      monthlyRevenue: [
        { month: "Nov 2025", amount: 0 },
        { month: "Oct 2025", amount: 600 },
        { month: "Sep 2025", amount: 0 }
      ],
      monthlyExpenses: [
        { month: "Nov 2025", amount: 1200 },
        { month: "Oct 2025", amount: 1100 },
        { month: "Sep 2025", amount: 800 }
      ]
    },
    settings: {
      allowOnlineRegistration: false,
      requireApproval: true,
      membershipDues: 75,
      meetingFrequency: "quarterly",
      meetingDay: "First Monday",
      meetingTime: "6:00 PM",
      autoRenewMembership: false,
      sendReminders: false,
      publicDirectory: false
    },
    createdAt: new Date("2021-07-22"),
    updatedAt: new Date("2025-10-30"),
    createdBy: "admin@example.com"
  }
];

export const mockChapterStatistics: ChapterOverallStatistics = {
  totalChapters: 5,
  activeChapters: 3,
  inactiveChapters: 1,
  pendingChapters: 1,
  suspendedChapters: 0,
  totalMembers: 658,
  averageMembersPerChapter: 131.6,
  totalEvents: 7,
  totalRevenue: 107000,
  memberGrowthRate: 8.7,
  topPerformingChapters: [
    {
      chapterId: "ch_1",
      chapterName: "New York Chapter",
      location: "New York, NY",
      memberCount: 245,
      growthRate: 12.5,
      eventCount: 4,
      attendanceRate: 78.3,
      revenue: 45600,
      engagementScore: 85.2
    },
    {
      chapterId: "ch_2",
      chapterName: "Los Angeles Chapter",
      location: "Los Angeles, CA",
      memberCount: 189,
      growthRate: 8.3,
      eventCount: 3,
      attendanceRate: 72.5,
      revenue: 32400,
      engagementScore: 78.9
    },
    {
      chapterId: "ch_3",
      chapterName: "Chicago Chapter",
      location: "Chicago, IL",
      memberCount: 156,
      growthRate: 5.2,
      eventCount: 2,
      attendanceRate: 68.9,
      revenue: 23400,
      engagementScore: 72.4
    }
  ],
  regionalBreakdown: [
    {
      region: "Northeast",
      country: "United States",
      chapterCount: 1,
      memberCount: 245,
      averageMembersPerChapter: 245,
      totalRevenue: 45600
    },
    {
      region: "West",
      country: "United States",
      chapterCount: 2,
      memberCount: 212,
      averageMembersPerChapter: 106,
      totalRevenue: 33600
    },
    {
      region: "Midwest",
      country: "United States",
      chapterCount: 1,
      memberCount: 156,
      averageMembersPerChapter: 156,
      totalRevenue: 23400
    },
    {
      region: "Southeast",
      country: "United States",
      chapterCount: 1,
      memberCount: 45,
      averageMembersPerChapter: 45,
      totalRevenue: 4400
    }
  ],
  monthlyTrend: [
    { month: "Nov 2025", memberCount: 658, eventCount: 10, attendanceRate: 71.2, revenue: 28150 },
    { month: "Oct 2025", memberCount: 636, eventCount: 12, attendanceRate: 68.7, revenue: 32200 },
    { month: "Sep 2025", memberCount: 617, eventCount: 10, attendanceRate: 69.3, revenue: 28300 }
  ]
};