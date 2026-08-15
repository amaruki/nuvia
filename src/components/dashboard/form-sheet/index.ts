/**
 * Standard dashboard CRUD form kit (CODING_STANDARD "Dashboard forms").
 *
 * Forms open in a right-side Sheet driven by URL params instead of
 * dedicated create/edit pages: `useFormSheet` owns the open state,
 * `FormSheet` owns the container, `FormActions` the sticky footer, and the
 * field shorthands keep every labelled control visually identical. File
 * uploads, rich editors, and field arrays are deliberate escape hatches:
 * compose them from the ui/form primitives directly.
 */

export { FormSheet, type FormSheetProps, type FormSheetSize } from "./form-sheet";
export { FormActions, type FormActionsProps } from "./form-actions";
export { FormSection, type FormSectionProps } from "./form-section";
export { UnsavedChangesGuard, type UnsavedChangesGuardProps } from "./unsaved-changes-guard";
export { useFormSheet, type FormSheetMode, type FormSheetState } from "./use-form-sheet";
export { TextField, type TextFieldProps } from "./text-field";
export { TextareaField, type TextareaFieldProps } from "./textarea-field";
export { SelectField, type SelectFieldOption, type SelectFieldProps } from "./select-field";
export { NumberField, type NumberFieldProps } from "./number-field";
export { CheckboxField, type CheckboxFieldProps } from "./checkbox-field";
export { DateField, type DateFieldProps } from "./date-field";
