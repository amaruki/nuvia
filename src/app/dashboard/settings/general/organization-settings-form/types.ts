// Shared types for the organization-settings-form components.

export interface OrganizationFormValues {
  name: string;
  legalName: string | null;
  logo: string | null;
  website: string | null;
  supportEmail: string | null;
  locale: string;
  currency: string;
  timezone: string;
}

export interface OrganizationSettingsFormProps {
  organization: OrganizationFormValues;
  canEdit: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
