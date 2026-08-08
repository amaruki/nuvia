"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { logger } from "@/lib/logger";

import { INITIAL_FORM_DATA } from "./create-event-helpers";
import type { CreateEventFormData } from "./create-event-types";

/**
 * Owns the create-event page's form state: tracks field values and tags, and
 * exposes change handlers plus the submit/cancel actions.
 */
export function useCreateEventForm() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState<CreateEventFormData>(INITIAL_FORM_DATA);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
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
      // Here you would typically call your API to create the event
      logger.info("Creating event with data", { ...formData, tags });

      // Simulate API call
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 1000);
      await promise;

      // Redirect to events page
      router.push("/events");
    } catch (error) {
      logger.error("Error creating event", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return {
    isSubmitting,
    tags,
    tagInput,
    formData,
    setTagInput,
    handleInputChange,
    handleCheckboxChange,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyPress,
    handleSubmit,
    handleGoBack,
  };
}
