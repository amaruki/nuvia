import type { UseFormReturn } from "react-hook-form";

import type { WorkspaceFormValues } from "@/lib/validation/organization.validation";

export type WorkspaceForm = UseFormReturn<WorkspaceFormValues>;

export interface WorkspaceFormSectionProps {
  form: WorkspaceForm;
}
