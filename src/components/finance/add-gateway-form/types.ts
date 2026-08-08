import { GatewayFormData } from "@/types/finance";

export interface AddGatewayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GatewayFormData) => void;
  initialData?: Partial<GatewayFormData>;
  isEditing?: boolean;
}
