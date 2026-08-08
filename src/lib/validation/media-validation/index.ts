// Media validation barrel — implementation is split into domain-grouped modules
// (shared rules, entity schemas, form schemas, filter schema, helpers) so each
// file stays within the project's 300-line limit.

// Base schemas
export { dateSchema, emailSchema, urlSchema, uuidSchema } from "./shared";

// Entity schemas
export {
  mediaFolderSchema,
  mediaMetadataSchema,
  mediaPermissionSchema,
  mediaSchema,
  mediaTagSchema,
  mediaUsageSchema,
  mediaVersionSchema,
} from "./entity.schemas";

// Form schemas
export {
  createFolderDataSchema,
  createMediaDataSchema,
  mediaFormDataSchema,
  mediaUploadOptionsSchema,
  updateFolderDataSchema,
  updateMediaDataSchema,
} from "./form.schemas";

// Filter schema
export { mediaFiltersSchema } from "./filter.schemas";

// Validation helpers
export {
  validateCreateFolderData,
  validateCreateMediaData,
  validateMedia,
  validateMediaFilters,
  validateMediaFolder,
  validateMediaFormData,
  validateMediaTag,
  validateMediaUploadOptions,
  validateUpdateFolderData,
  validateUpdateMediaData,
} from "./helpers";

// Type exports for inference
export type {
  CreateFolderData,
  CreateMediaData,
  MediaFormData,
  MediaUploadOptions,
  UpdateFolderData,
  UpdateMediaData,
} from "./form.schemas";
export type { MediaFilters } from "./filter.schemas";
