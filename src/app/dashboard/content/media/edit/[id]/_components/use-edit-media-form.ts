"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useMedia } from "@/lib/hooks/use-media";
import type { Media } from "@/types/media";

import { INITIAL_MEDIA_FORM_DATA } from "./edit-media-helpers";
import type { MediaEditFormData } from "./edit-media-helpers";

const MEDIA_LIBRARY_PATH = "/dashboard/content/media";

/**
 * Owns the edit-media page's data lifecycle and form state: seeds the form
 * from the loaded media item and exposes change handlers plus the
 * save/delete/preview actions.
 */
export function useEditMediaForm(mediaId: string) {
  const router = useRouter();

  const { media, updateMedia, deleteMedia, loading } = useMedia();
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [formData, setFormData] = useState<MediaEditFormData>(INITIAL_MEDIA_FORM_DATA);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const mediaItem = media.find((m) => m.id === mediaId);
    if (mediaItem) {
      setCurrentMedia(mediaItem);
      setFormData({
        title: mediaItem.title,
        description: mediaItem.description || "",
        altText: mediaItem.altText || "",
        visibility: mediaItem.visibility,
        tags: mediaItem.tags.map((tag) => tag.name),
        folderId: mediaItem.folderId || "",
      });
    }
  }, [mediaId, media]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSave = async () => {
    if (!currentMedia) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateMedia(mediaId, {
        title: formData.title,
        description: formData.description,
        altText: formData.altText,
        visibility: formData.visibility,
        tags: formData.tags,
        folderId: formData.folderId || undefined,
      });

      router.push(MEDIA_LIBRARY_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update media");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!currentMedia) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentMedia) return;
    setIsDeleteDialogOpen(false);
    try {
      await deleteMedia(mediaId);
      router.push(MEDIA_LIBRARY_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete media");
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handlePreview = () => {
    if (currentMedia) {
      window.open(currentMedia.url, "_blank");
    }
  };

  const handleGoBack = () => {
    router.push(MEDIA_LIBRARY_PATH);
  };

  return {
    currentMedia,
    loading,
    formData,
    tagInput,
    error,
    isSaving,
    setTagInput,
    handleInputChange,
    handleAddTag,
    handleRemoveTag,
    handleSave,
    handleDelete,
    isDeleteDialogOpen,
    handleConfirmDelete,
    handleCloseDeleteDialog,
    handlePreview,
    handleGoBack,
  };
}
