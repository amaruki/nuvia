"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
import { createEvent, createEventCategory, getEventCategories } from "@/lib/services/event";
import type { ApiEventCategory } from "@/lib/services/event/types";

import {
  INITIAL_FORM_DATA,
  buildCreateEventRequest,
  validateCreateFormData,
} from "./create-event-helpers";
import type { CreateEventFormData } from "./create-event-types";

/**
 * Owns the create-event page's form state: tracks field values and tags,
 * loads category reference data, validates the form, and submits through the
 * real event service (POST /api/v1/events). No simulated saves.
 */
export function useCreateEventForm() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [formData, setFormData] = React.useState<CreateEventFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Category reference data (GET /api/v1/events/categories). The events
  // table requires a category, so the select is populated from the API and
  // an inline affordance creates the first category on fresh installs.
  const [categories, setCategories] = React.useState<ApiEventCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isAddingCategory, setIsAddingCategory] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const list = await getEventCategories();
      setCategories(list);
    } catch (error) {
      logger.error("Error loading event categories", error);
      setCategoriesError("Could not load event categories. Try reloading the page.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const clearFieldError = (name: string) => {
    setFormErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
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

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || isAddingCategory) return;
    setIsAddingCategory(true);
    try {
      const created = await createEventCategory({ name, displayName: name });
      setNewCategoryName("");
      await loadCategories();
      setFormData((prev) => ({ ...prev, category: created.name }));
      clearFieldError("category");
      toast.success(`Category "${created.displayName}" created`);
    } catch (error) {
      logger.error("Error creating event category", error);
      toast.error(error instanceof Error ? error.message : "Failed to create category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateCreateFormData(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createEvent(buildCreateEventRequest(formData, tags));
      toast.success("Event created");
      router.push(`/events/${created.id}`);
    } catch (error) {
      logger.error("Error creating event", error);
      toast.error(error instanceof Error ? error.message : "Failed to create event");
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
    formErrors,
    setTagInput,
    handleInputChange,
    handleCheckboxChange,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyPress,
    handleSubmit,
    handleGoBack,
    categories,
    categoriesLoading,
    categoriesError,
    newCategoryName,
    setNewCategoryName,
    isAddingCategory,
    handleAddCategory,
  };
}
