"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventLayout } from "@/components/events/event-layout";
import { EventStatus, EventType } from "@/types/event";

import { BasicInfoSection } from "./_components/basic-info-section";
import { CapacitySection } from "./_components/capacity-section";
import { DateTimeSection } from "./_components/date-time-section";
import { FormActions } from "./_components/form-actions";
import { LocationSection } from "./_components/location-section";
import { TagsSection } from "./_components/tags-section";
import { useCreateEventForm } from "./_components/use-create-event-form";

export default function CreateEventPage() {
  const {
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
  } = useCreateEventForm();

  return (
    <EventLayout
      event={{
        id: "new",
        title: "Create New Event",
        description: "",
        eventType: EventType.WORKSHOP,
        status: EventStatus.DRAFT,
        startDate: new Date(),
        endDate: new Date(),
        location: "",
        isVirtual: false,
        isInPerson: true,
        currentAttendees: 0,
        organizerId: "",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }}
      showActions={false}
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicInfoSection formData={formData} onInputChange={handleInputChange} />

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
  );
}
