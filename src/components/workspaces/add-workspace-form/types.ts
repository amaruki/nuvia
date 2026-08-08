import { UseFormReturn } from "react-hook-form";
import { WorkspaceFormData } from "@/types/committee";
import { WorkspaceFormValues } from "./schema";

export interface AddWorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  initialData?: Partial<WorkspaceFormData>;
  isEditing?: boolean;
}

export type WorkspaceForm = UseFormReturn<WorkspaceFormValues>;
