"use client";

/**
 * Form state and handlers behind the public event edit page.
 *
 * Loads the event, mirrors it into flat form state (dates as
 * `datetime-local` strings), and owns field, tag and submit handling so
 * page.tsx stays a thin orchestrator.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Event } from "@/types/event";
import { getEventById, updateEvent } from "@/lib/services/event";
import { logger } from "@/lib/logger";
import { buildUpdateEventRequest, validateEditFormData } from "./helpers";
import { EventFormData, initialFormData } from "./types";

export interface UseEditEventFormResult {
  event: Event | null;
  isLoading: boolean;
  isSubmitting: boolean;
  formData: EventFormData;
  tags: string[];
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tagToRemove: string) => void;
  handleTagKeyPress: (e: React.KeyboardEvent) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useEditEventForm(eventId: string): UseEditEventFormResult {
  const router = useRouter();

  const [event, setEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState<EventFormData>(initialFormData);

  React.useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        const response = await getEventById(eventId);
        const eventData = response.event;

        setEvent(eventData);
        setTags(eventData.tags);

        // Format dates for input fields
        const formatDateForInput = (date: Date) => {
          return new Date(date).toISOString().slice(0, 16);
        };

        setFormData({
          title: eventData.title,
          description: eventData.description,
          shortDescription: eventData.shortDescription || "",
          eventType: eventData.eventType,
          status: eventData.status,
          startDate: formatDateForInput(eventData.startDate),
          endDate: formatDateForInput(eventData.endDate),
          location: eventData.location,
          virtualEventUrl: eventData.virtualEventUrl || "",
          isVirtual: eventData.isVirtual,
          isInPerson: eventData.isInPerson,
          maxAttendees: eventData.maxAttendees?.toString() || "",
          registrationDeadline: eventData.registrationDeadline
            ? formatDateForInput(eventData.registrationDeadline)
            : "",
        });
      } catch (error) {
        logger.error("Error fetching event data", error);
        router.push("/events");
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateEditFormData(formData);
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEvent(eventId, buildUpdateEventRequest(formData, tags));
      toast.success("Event updated");
      router.push(`/events/${eventId}`);
    } catch (error) {
      logger.error("Error updating event", error);
      toast.error(error instanceof Error ? error.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    event,
    isLoading,
    isSubmitting,
    formData,
    tags,
    tagInput,
    setTagInput,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyPress,
    handleSubmit,
  };
}
