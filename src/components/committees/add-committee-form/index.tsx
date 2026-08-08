"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CommitteeFormData } from "@/types/committee";
import { committeeFormSchema, CommitteeFormValues } from "./schema";
import { AddCommitteeFormProps } from "./types";
import { BasicInfoSection } from "./basic-info-section";
import { ContactSection } from "./contact-section";
import { CharterSection } from "./charter-section";

export function AddCommitteeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddCommitteeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      purpose: "",
      status: "pending",
      type: "functional",
      contactInfo: {
        email: "",
        phone: "",
        meetingLocation: "",
        virtualMeetingLink: "",
        website: "",
      },
      charter: {
        missionStatement: "",
        responsibilities: [],
        authorityLevel: "operational",
        decisionMakingProcess: "",
        reportingStructure: "",
        termLimits: {
          chairTerm: 24,
          memberTerm: 24,
          maxTerms: 2,
        },
      },
      parentCommitteeId: "",
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form.reset]);

  const handleSubmit = async (values: CommitteeFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values as CommitteeFormData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      logger.error("Error submitting committee form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Committee" : "Create New Committee"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the committee information and charter details."
              : "Fill in the committee details and establish the charter."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <BasicInfoSection form={form} />

          <ContactSection form={form} />

          <CharterSection form={form} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Committee" : "Create Committee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
