import { Event, EventRegistration, EventCertificate, EventStatus, EventType, RegistrationStatus } from "@/types/event.types";
import { SafeUser } from "@/types/auth.types";

// Mock organizer
const mockOrganizer: SafeUser = {
  id: "user-organizer-1",
  username: "eventorganizer",
  emailVerified: true,
  displayName: "Event Organizer",
  email: "organizer@example.com",
  profilePhoto: "",
//   role: "member",
  createdAt: new Date("2023-01-01"),
  updatedAt: new Date(),
};

// Mock user
const mockUser: SafeUser = {
  id: "user-1",
  username: "johndoe",
  displayName: "John Doe",
  email: "john.doe@example.com",
  emailVerified: true,
  profilePhoto: "",
//   role: "member",
  createdAt: new Date("2023-01-15"),
  updatedAt: new Date(),
};

// Mock events
export const mockEvents: Event[] = [
  {
    id: "event-1",
    title: "Web Development Workshop",
    description: "Learn the latest techniques in modern web development with hands-on workshops and expert guidance. This workshop covers HTML5, CSS3, JavaScript ES6+, React, and modern development tools.",
    shortDescription: "Hands-on workshop covering modern web development techniques.",
    eventType: EventType.WORKSHOP,
    status: EventStatus.PUBLISHED,
    startDate: new Date("2023-10-15T09:00:00"),
    endDate: new Date("2023-10-15T17:00:00"),
    location: "Tech Hub, Building A",
    virtualEventUrl: "",
    isVirtual: false,
    isInPerson: true,
    maxAttendees: 30,
    currentAttendees: 24,
    registrationDeadline: new Date("2023-10-14T23:59:59"),
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    coverImage: "",
    tags: ["web development", "workshop", "coding", "javascript"],
    createdAt: new Date("2023-09-01"),
    updatedAt: new Date("2023-09-15"),
  },
  {
    id: "event-2",
    title: "Community Meetup",
    description: "Monthly community gathering to network, share ideas, and discuss the latest trends in technology. Join us for an evening of presentations, networking, and refreshments.",
    shortDescription: "Monthly community networking event with tech talks.",
    eventType: EventType.MEETUP,
    status: EventStatus.PUBLISHED,
    startDate: new Date("2023-10-20T18:00:00"),
    endDate: new Date("2023-10-20T21:00:00"),
    location: "Community Center",
    virtualEventUrl: "",
    isVirtual: false,
    isInPerson: true,
    maxAttendees: 50,
    currentAttendees: 42,
    registrationDeadline: new Date("2023-10-19T23:59:59"),
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    coverImage: "",
    tags: ["community", "networking", "meetup", "technology"],
    createdAt: new Date("2023-09-10"),
    updatedAt: new Date("2023-09-20"),
  },
  {
    id: "event-3",
    title: "React Conference 2023",
    description: "Annual conference featuring the latest updates in React ecosystem and best practices from industry experts. Three days of talks, workshops, and networking opportunities.",
    shortDescription: "Annual conference for React developers with talks and workshops.",
    eventType: EventType.CONFERENCE,
    status: EventStatus.PUBLISHED,
    startDate: new Date("2023-11-05T09:00:00"),
    endDate: new Date("2023-11-07T18:00:00"),
    location: "Convention Center",
    virtualEventUrl: "https://reactconf2023.com/live",
    isVirtual: true,
    isInPerson: true,
    maxAttendees: 500,
    currentAttendees: 475,
    registrationDeadline: new Date("2023-11-04T23:59:59"),
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    coverImage: "",
    tags: ["react", "conference", "javascript", "web development"],
    createdAt: new Date("2023-08-01"),
    updatedAt: new Date("2023-10-01"),
  },
  {
    id: "event-4",
    title: "UI/UX Design Masterclass",
    description: "Intensive masterclass on creating intuitive and beautiful user interfaces and experiences. Learn design principles, tools, and techniques from industry experts.",
    shortDescription: "Masterclass on UI/UX design principles and techniques.",
    eventType: EventType.TRAINING,
    status: EventStatus.PUBLISHED,
    startDate: new Date("2023-10-25T10:00:00"),
    endDate: new Date("2023-10-25T16:00:00"),
    location: "Design Studio",
    virtualEventUrl: "",
    isVirtual: false,
    isInPerson: true,
    maxAttendees: 20,
    currentAttendees: 18,
    registrationDeadline: new Date("2023-10-24T23:59:59"),
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    coverImage: "",
    tags: ["ui", "ux", "design", "masterclass"],
    createdAt: new Date("2023-09-05"),
    updatedAt: new Date("2023-09-25"),
  },
  {
    id: "event-5",
    title: "JavaScript Webinar",
    description: "Learn advanced JavaScript concepts and best practices in this live webinar. Topics include closures, async/await, prototypes, and modern ES6+ features.",
    shortDescription: "Live webinar on advanced JavaScript concepts.",
    eventType: EventType.WEBINAR,
    status: EventStatus.PUBLISHED,
    startDate: new Date("2023-10-30T14:00:00"),
    endDate: new Date("2023-10-30T16:00:00"),
    location: "Online",
    virtualEventUrl: "https://javascript-webinar.com/live",
    isVirtual: true,
    isInPerson: false,
    maxAttendees: 100,
    currentAttendees: 87,
    registrationDeadline: new Date("2023-10-30T13:00:00"),
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    coverImage: "",
    tags: ["javascript", "webinar", "online", "programming"],
    createdAt: new Date("2023-09-15"),
    updatedAt: new Date("2023-10-15"),
  },
  {
    id: "event-6",
    title: "Team Building Social",
    description: "Fun social event with team building activities, games, and networking. A great opportunity to connect with colleagues in a relaxed environment.",
    shortDescription: "Social event with team building activities and games.",
    eventType: EventType.SOCIAL,
    status: EventStatus.PUBLISHED,
    startDate: new Date("2023-11-10T15:00:00"),
    endDate: new Date("2023-11-10T19:00:00"),
    location: "Community Park",
    virtualEventUrl: "",
    isVirtual: false,
    isInPerson: true,
    maxAttendees: 40,
    currentAttendees: 35,
    registrationDeadline: new Date("2023-11-09T23:59:59"),
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    coverImage: "",
    tags: ["social", "team building", "networking", "fun"],
    createdAt: new Date("2023-10-01"),
    updatedAt: new Date("2023-10-20"),
  },
];

// Mock event registrations
export const mockEventRegistrations: EventRegistration[] = [
  {
    id: "reg-1",
    eventId: "event-1",
    userId: mockUser.id,
    user: mockUser,
    status: RegistrationStatus.CONFIRMED,
    registeredAt: new Date("2023-09-10"),
    checkedInAt: new Date("2023-10-15T09:15:00"),
    checkInMethod: "qr",
    certificateIssued: true,
    certificateUrl: "https://example.com/certificates/cert-1.pdf",
    notes: "Looking forward to learning about modern web development techniques.",
    createdAt: new Date("2023-09-10"),
    updatedAt: new Date("2023-10-15"),
  },
  {
    id: "reg-2",
    eventId: "event-2",
    userId: mockUser.id,
    user: mockUser,
    status: RegistrationStatus.CONFIRMED,
    registeredAt: new Date("2023-09-20"),
    checkedInAt: new Date("2023-10-20T18:10:00"),
    checkInMethod: "manual",
    certificateIssued: false,
    notes: "",
    createdAt: new Date("2023-09-20"),
    updatedAt: new Date("2023-10-20"),
  },
  {
    id: "reg-3",
    eventId: "event-3",
    userId: mockUser.id,
    user: mockUser,
    status: RegistrationStatus.CONFIRMED,
    registeredAt: new Date("2023-08-15"),
    checkedInAt: undefined,
    checkInMethod: undefined,
    certificateIssued: false,
    notes: "Excited to attend the React conference!",
    createdAt: new Date("2023-08-15"),
    updatedAt: new Date("2023-10-01"),
  },
  {
    id: "reg-4",
    eventId: "event-4",
    userId: mockUser.id,
    user: mockUser,
    status: RegistrationStatus.CONFIRMED,
    registeredAt: new Date("2023-09-25"),
    checkedInAt: undefined,
    checkInMethod: undefined,
    certificateIssued: false,
    notes: "Hoping to improve my UI/UX design skills.",
    createdAt: new Date("2023-09-25"),
    updatedAt: new Date("2023-09-25"),
  },
];

// Mock event certificates
export const mockEventCertificates: EventCertificate[] = [
  {
    id: "cert-1",
    eventId: "event-1",
    event: mockEvents[0],
    userId: mockUser.id,
    user: mockUser,
    issuedAt: new Date("2023-10-16"),
    certificateUrl: "https://example.com/certificates/cert-1.pdf",
    verificationCode: "VERIFY-REG1",
    createdAt: new Date("2023-10-16"),
    updatedAt: new Date("2023-10-16"),
  },
];

// Helper function to get mock events with pagination
export function getMockEvents(
  filter?: {
    status?: EventStatus[];
    eventType?: EventType[];
    startDate?: Date;
    endDate?: Date;
    organizerId?: string;
    tags?: string[];
    isVirtual?: boolean;
    isInPerson?: boolean;
    searchQuery?: string;
  },
  page = 1,
  pageSize = 10
) {
  let filteredEvents = [...mockEvents];

  // Apply filters
  if (filter) {
    if (filter.status && filter.status.length > 0) {
      filteredEvents = filteredEvents.filter(event => filter.status!.includes(event.status));
    }
    
    if (filter.eventType && filter.eventType.length > 0) {
      filteredEvents = filteredEvents.filter(event => filter.eventType!.includes(event.eventType));
    }
    
    if (filter.startDate) {
      filteredEvents = filteredEvents.filter(event => new Date(event.startDate) >= filter.startDate!);
    }
    
    if (filter.endDate) {
      filteredEvents = filteredEvents.filter(event => new Date(event.startDate) <= filter.endDate!);
    }
    
    if (filter.organizerId) {
      filteredEvents = filteredEvents.filter(event => event.organizerId === filter.organizerId);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filter.tags!.some(tag => event.tags.includes(tag))
      );
    }
    
    if (filter.isVirtual !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.isVirtual === filter.isVirtual);
    }
    
    if (filter.isInPerson !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.isInPerson === filter.isInPerson);
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.shortDescription?.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
  }

  // Sort by start date (upcoming first)
  filteredEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  return {
    events: paginatedEvents,
    totalCount: filteredEvents.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredEvents.length / pageSize),
  };
}

// Helper function to get mock event by ID
export function getMockEventById(eventId: string) {
  const event = mockEvents.find(e => e.id === eventId);
  
  if (!event) {
    throw new Error("Event not found");
  }
  
  // Check if user is registered
  const registration = mockEventRegistrations.find(r => r.eventId === eventId && r.userId === mockUser.id);
  
  return {
    event,
    isRegistered: !!registration,
    registration,
    organizerEvents: mockEvents.filter(e => e.organizerId === event.organizerId && e.id !== event.id),
    similarEvents: mockEvents.filter(e => 
      e.id !== event.id && 
      (e.eventType === event.eventType || e.tags.some(tag => event.tags.includes(tag)))
    ),
  };
}

// Helper function to get mock user event registrations
export function getMockUserEventRegistrations(
  userId: string,
  status?: RegistrationStatus[]
) {
  let registrations = mockEventRegistrations.filter(r => r.userId === userId);
  
  if (status && status.length > 0) {
    registrations = registrations.filter(r => status.includes(r.status));
  }
  
  return registrations.map(registration => {
    const event = mockEvents.find(e => e.id === registration.eventId);
    return {
      ...registration,
      event,
    };
  });
}

// Helper function to get mock event dashboard data
export function getMockEventDashboardData() {
  const upcomingEvents = mockEvents.filter(e => new Date(e.startDate) > new Date());
  const myEvents = mockEvents.filter(e => e.organizerId === mockUser.id);
  const myRegistrationsData = getMockUserEventRegistrations(mockUser.id);
  
  // Transform registrations to match the expected format
  const myRegistrations = myRegistrationsData
    .filter(reg => reg.event) // Only include registrations with valid events
    .map(reg => ({
      event: reg.event!,
      registration: reg,
    }));
  
  const eventStatistics = {
    totalEvents: mockEvents.length,
    upcomingEvents: upcomingEvents.length,
    completedEvents: mockEvents.filter(e => new Date(e.endDate) < new Date()).length,
    cancelledEvents: mockEvents.filter(e => e.status === EventStatus.CANCELLED).length,
    totalRegistrations: mockEventRegistrations.length,
    averageAttendanceRate: 85.5,
    popularEventTypes: [
      { eventType: EventType.WORKSHOP, count: 2 },
      { eventType: EventType.MEETUP, count: 1 },
      { eventType: EventType.CONFERENCE, count: 1 },
      { eventType: EventType.TRAINING, count: 1 },
      { eventType: EventType.WEBINAR, count: 1 },
    ],
    monthlyStats: [
      { month: "2023-09", events: 3, registrations: 15 },
      { month: "2023-10", events: 2, registrations: 12 },
      { month: "2023-11", events: 1, registrations: 8 },
    ],
  };
  
  return {
    upcomingEvents,
    myEvents,
    myRegistrations,
    eventStatistics,
  };
}