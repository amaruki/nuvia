"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { EventLayout } from "@/components/events/event-layout";
import { useEditEventForm } from "./_components/use-edit-event-form";
import { BasicInfoSection } from "./_components/basic-info-section";
import { DateTimeSection } from "./_components/date-time-section";
import { LocationSection } from "./_components/location-section";
import { CapacitySection } from "./_components/capacity-section";
import { TagsSection } from "./_components/tags-section";
import { FormActions } from "./_components/form-actions";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const {
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
  } = useEditEventForm(eventId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground/90 mb-2">Event Not Found</h1>
        <p className="text-foreground/60 mb-6">
          The event you're trying to edit doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <EventLayout event={event} showActions={false}>
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicInfoSection
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
              />
              <DateTimeSection formData={formData} onInputChange={handleInputChange} />
              <LocationSection
                formData={formData}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
              />
              <CapacitySection formData={formData} onInputChange={handleInputChange} />
              <TagsSection
                tags={tags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onTagKeyPress={handleTagKeyPress}
              />
              <FormActions isSubmitting={isSubmitting} onCancel={() => router.back()} />
            </form>
          </CardContent>
        </Card>
      </div>
    </EventLayout>
  );
}
