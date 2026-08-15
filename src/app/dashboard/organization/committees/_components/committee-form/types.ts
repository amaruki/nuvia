import type { UseFormReturn } from "react-hook-form";

import type { CommitteeFormValues } from "@/lib/validation/organization.validation";

export type CommitteeForm = UseFormReturn<CommitteeFormValues>;

export interface CommitteeFormSectionProps {
  form: CommitteeForm;
}
