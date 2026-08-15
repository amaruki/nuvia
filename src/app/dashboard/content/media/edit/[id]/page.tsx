"use client";

import { useParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";

import { ActionsCard } from "./_components/actions-card";
import { BasicInfoCard } from "./_components/basic-info-card";
import { EditMediaHeader } from "./_components/edit-media-header";
import { MediaPreviewCard } from "./_components/media-preview-card";
import { EditMediaLoadingState } from "./_components/page-states";
import { TagsCard } from "./_components/tags-card";
import { useEditMediaForm } from "./_components/use-edit-media-form";

export default function EditMediaPage() {
  const params = useParams();
  const mediaId = params.id as string;

  const {
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
  } = useEditMediaForm(mediaId);

  if (!currentMedia) {
    return <EditMediaLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Media" />
      <EditMediaHeader
        media={currentMedia}
        onGoBack={handleGoBack}
        onPreview={handlePreview}
        onDelete={handleDelete}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <BasicInfoCard formData={formData} onInputChange={handleInputChange} />

          <TagsCard
            tags={formData.tags}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MediaPreviewCard media={currentMedia} />

          <ActionsCard
            mediaUrl={currentMedia.url}
            isSaving={isSaving}
            isLoading={loading}
            onSave={handleSave}
            onPreview={handlePreview}
          />
        </div>
      </div>

      {/* Delete confirmation dialog (UI-06: replaces native confirm()). */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${currentMedia.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
