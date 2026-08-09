"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { getEventById, updateEvent } from "@/lib/services/event";
import { Event } from "@/types/event";

import {
  INITIAL_FORM_DATA,
  buildUpdateEventRequest,
  mapEventToFormData,
  validateEditFormData,
} from "./edit-event-helpers";
import type { EventFormData } from "./edit-event-types";

/**
 * Owns the edit-event page's data lifecycle and form state: fetches the
 * event, seeds the form, validates input, and persists through the real
 * event service (PATCH /api/v1/events/:id). No simulated saves.
 */
export function useEditEventForm(eventId: string) {
  const router = useRouter();

  const [event, setEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState<EventFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        const response = await getEventById(eventId);
        const eventData = response.event;

        setEvent(eventData);
        setTags(eventData.tags);
        setFormData(mapEventToFormData(eventData));
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

  const clearFieldError = (name: string) => {
    setFormErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearFieldError(name);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearFieldError(name);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    clearFieldError(name);
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
    setFormErrors(errors);
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

  const handleGoBack = () => {
    router.back();
  };

  return {
    event,
    isLoading,
    isSubmitting,
    tags,
    tagInput,
    formData,
    formErrors,
    setTagInput,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyPress,
    handleSubmit,
    handleGoBack,
  };
}
