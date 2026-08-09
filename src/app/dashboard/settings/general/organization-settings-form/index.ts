/**
 * Organization settings form barrel.
 *
 * Keeps "./organization-settings-form" resolving after the old monolithic
 * organization-settings-form.tsx was split into this directory:
 *
 *   - organization-settings-form.tsx OrganizationSettingsForm state, submit and fields
 *   - options.ts                     locale/currency/timezone datalist suggestions
 *   - types.ts                       shared OrganizationFormValues/props/field-error types
 */
export { OrganizationSettingsForm } from "./organization-settings-form";
export type { OrganizationFormValues } from "./types";
