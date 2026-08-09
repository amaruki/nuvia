import { z } from "zod";
import { Event, EventRegistration } from "@/types/event";
import type { EventCheckInInput } from "@/lib/validation/event.validation";

export interface EventCheckInProps {
  event: Event;
  onCheckIn: (data: EventCheckInInput) => void;
  onSearchRegistration?: (searchTerm: string) => void;
  isSubmitting?: boolean;
  searchResults?: EventRegistration[];
  className?: string;
}

export const checkInFormSchema = z.object({
  verificationCode: z.string().min(1, "Verification code is required"),
});

export type CheckInFormInput = z.infer<typeof checkInFormSchema>;
