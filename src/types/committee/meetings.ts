export interface WorkspaceMeeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: string;
  isVirtual: boolean;
  virtualMeetingLink?: string;
  status: MeetingStatus;
  organizer: string;
  attendees: MeetingAttendee[];
  agenda: MeetingAgendaItem[];
  minutes?: string;
  recordingUrl?: string;
  attachments: MeetingAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface MeetingAttendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AttendeeRole;
  status: AttendeeStatus;
  joinedAt?: Date;
  leftAt?: Date;
}

export type AttendeeRole = "organizer" | "presenter" | "attendee";

export type AttendeeStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "tentative"
  | "attended"
  | "absent";

export interface MeetingAgendaItem {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  presenter?: string;
  order: number;
  isCompleted: boolean;
  notes?: string;
}

export interface MeetingAttachment {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  type: "agenda" | "presentation" | "minutes" | "other";
}
