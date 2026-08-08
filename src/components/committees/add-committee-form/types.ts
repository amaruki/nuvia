import { UseFormReturn } from "react-hook-form";
import { CommitteeFormData } from "@/types/committee";
import { CommitteeFormValues } from "./schema";

export interface AddCommitteeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CommitteeFormData) => Promise<void>;
  initialData?: Partial<CommitteeFormData>;
  isEditing?: boolean;
}

export type CommitteeForm = UseFormReturn<CommitteeFormValues>;
