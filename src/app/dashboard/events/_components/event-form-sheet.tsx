"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  FormActions,
  FormSection,
  FormSheet,
  type FormSheetState,
} from "@/components/dashboard/form-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useEvent } from "@/lib/hooks/use-events";
import { logger } from "@/lib/logger";
import { createEvent, updateEvent } from "@/lib/services/event";
import {
  eventCreateFormSchema,
  eventFormSchema,
  type EventFormValues,
} from "@/lib/validation/event.validation";

import { BasicInfoSection } from "./event-form/basic-info-section";
import { CapacitySection } from "./event-form/capacity-section";
import { DateTimeSection } from "./event-form/date-time-section";
import {
  buildCreateEventRequest,
  buildUpdateEventRequest,
  toFormState,
} from "./event-form/helpers";
import { LocationSection } from "./event-form/location-section";
import { TagsSection } from "./event-form/tags-section";

const FORM_ID = "event-form";

export interface EventFormSheetProps {
  sheet: FormSheetState;
  /** Called after a successful save so the list page can refetch its rows. */
  onSaved?: () => void;
}

/**
 * URL-driven create/edit sheet for dashboard events (CODING_STANDARD
 * "Dashboard CRUD forms"). Opens on ?form=new / ?form=<id> from the events
 * list page; one form serves both modes. Create posts through
 * createEvent (POST /api/v1/events); edit loads the event through the same
 * useEvent query the old edit page used and patches it via updateEvent.
 */
export function EventFormSheet({ sheet, onSaved }: EventFormSheetProps) {
  const isEdit = sheet.mode === "edit";

  const {
    event: fetchedEvent,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(sheet.editId ?? "");
  // useEvent keeps the previous row in state across id changes; only accept
  // the event that matches the id the sheet is open for.
  const event = isEdit && fetchedEvent?.id === sheet.editId ? fetchedEvent : null;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(isEdit ? eventFormSchema : eventCreateFormSchema),
    defaultValues: toFormState(null),
  });

  // Seed (or re-seed) every time the sheet opens or the edit target
  // changes; defaultValues alone would keep stale input across open/close
  // cycles. In edit mode, wait for the fetch so the real event seeds the
  // defaults instead of an empty draft.
  useEffect(() => {
    if (sheet.mode === "closed") return;
    if (isEdit && !event) return;
    form.reset(toFormState(event));
    setSubmitError(null);
  }, [sheet.mode, sheet.editId, isEdit, event, form]);

  const onSubmit = async (values: EventFormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && event) {
        await updateEvent(event.id, buildUpdateEventRequest(values));
        toast.success("Event updated");
      } else {
        await createEvent(buildCreateEventRequest(values));
        toast.success("Event created");
      }
      onSaved?.();
      sheet.close();
    } catch (error) {
      logger.error("Error saving event", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to save the event.");
    }
  };

  const { isDirty, isSubmitting } = form.formState;
  const showEventLoading = isEdit && eventLoading && !event && !eventError;
  const showEventMissing = isEdit && !eventLoading && !event && !eventError;
  const showForm = !showEventLoading && !showEventMissing && !eventError;

  return (
    <FormSheet
      open={sheet.mode !== "closed"}
      onOpenChange={(open) => {
        if (!open) sheet.close();
      }}
      title={isEdit ? "Edit Event" : "Create Event"}
      description={
        isEdit
          ? "Update the event details below."
          : "Add a new event so members can find and register for it."
      }
      size="wide"
      isDirty={isDirty && !isSubmitting}
      footer={
        showForm ? (
          <FormActions
            formId={FORM_ID}
            mode={isEdit ? "edit" : "create"}
            submitting={isSubmitting}
            onCancel={sheet.close}
            entityLabel="Event"
          />
        ) : undefined
      }
    >
      {showEventLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : showEventMissing || eventError ? (
        <div className="space-y-6 p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {eventError ?? "This event no longer exists. Close the sheet and refresh the list."}
            </AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={sheet.close}>
            Close
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-6 p-6"
          >
            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <FormSection title="Basic Information">
              <BasicInfoSection mode={isEdit ? "edit" : "create"} />
            </FormSection>
            <FormSection title="Date and Time">
              <DateTimeSection />
            </FormSection>
            <FormSection title="Location">
              <LocationSection />
            </FormSection>
            <FormSection title="Capacity">
              <CapacitySection />
            </FormSection>
            <FormSection title="Tags">
              <TagsSection />
            </FormSection>
          </form>
        </Form>
      )}
    </FormSheet>
  );
}
