"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";

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
    formErrors,
    setTagInput,
    handleInputChange,
    handleCheckboxChange,
    handleSelectChange,
    handleCheckedChange,
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
  } = useCreateEventForm();

  return (
    <>
      <PageHeader title="Create New Event" />
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <BasicInfoSection
                formData={formData}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                errors={formErrors}
                categories={categories}
                categoriesLoading={categoriesLoading}
                categoriesError={categoriesError}
                newCategoryName={newCategoryName}
                onNewCategoryNameChange={setNewCategoryName}
                onAddCategory={handleAddCategory}
                isAddingCategory={isAddingCategory}
              />

              <DateTimeSection formData={formData} onInputChange={handleInputChange} />

              <LocationSection
                formData={formData}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
                onCheckedChange={handleCheckedChange}
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
    </>
  );
}
