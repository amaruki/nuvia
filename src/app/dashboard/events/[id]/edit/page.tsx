"use client";

import { useParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { EventLayout } from "@/components/events/event-layout";
import { PageHeader } from "@/components/dashboard/page-header";

import { BasicInfoSection } from "./_components/basic-info-section";
import { CapacitySection } from "./_components/capacity-section";
import { DateTimeSection } from "./_components/date-time-section";
import { FormActions } from "./_components/form-actions";
import { LocationSection } from "./_components/location-section";
import { EditEventLoadingState, EventNotFoundState } from "./_components/page-states";
import { TagsSection } from "./_components/tags-section";
import { useEditEventForm } from "./_components/use-edit-event-form";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.id as string;

  const {
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
  } = useEditEventForm(eventId);

  if (isLoading) {
    return <EditEventLoadingState />;
  }

  if (!event) {
    return <EventNotFoundState onGoBack={handleGoBack} />;
  }

  return (
    <>
      <PageHeader title="Edit Event" />
      <EventLayout embedded event={event} showActions={false}>
        <div className="max-w-3xl mx-auto">
          <Card>
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

                <FormActions isSubmitting={isSubmitting} onCancel={handleGoBack} />
              </form>
            </CardContent>
          </Card>
        </div>
      </EventLayout>
    </>
  );
}
