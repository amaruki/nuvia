"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { logger } from "@/lib/logger";
import { getEventById } from "@/lib/services/event";
import { Event } from "@/types/event";

import { INITIAL_FORM_DATA, mapEventToFormData } from "./edit-event-helpers";
import type { EventFormData } from "./edit-event-types";

/**
 * Owns the edit-event page's data lifecycle and form state: fetches the event,
 * seeds the form, and exposes change handlers plus the submit/cancel actions.
 */
export function useEditEventForm(eventId: string) {
  const router = useRouter();

  const [event, setEvent] = React.useState<Event | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState<EventFormData>(INITIAL_FORM_DATA);

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
    setIsSubmitting(true);

    try {
      // Here you would typically call your API to update the event
      logger.info("Updating event with data", { ...formData, tags });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to event details page
      router.push(`/events/${eventId}`);
    } catch (error) {
      logger.error("Error updating event", error);
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
