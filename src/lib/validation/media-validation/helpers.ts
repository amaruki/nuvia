import { mediaFolderSchema, mediaSchema, mediaTagSchema } from "./entity.schemas";
import { mediaFiltersSchema } from "./filter.schemas";
import {
  createFolderDataSchema,
  createMediaDataSchema,
  mediaFormDataSchema,
  mediaUploadOptionsSchema,
  updateFolderDataSchema,
  updateMediaDataSchema,
} from "./form.schemas";

// Validation functions
export const validateCreateMediaData = (data: unknown) => createMediaDataSchema.safeParse(data);
export const validateUpdateMediaData = (data: unknown) => updateMediaDataSchema.safeParse(data);
export const validateMediaFormData = (data: unknown) => mediaFormDataSchema.safeParse(data);
export const validateMediaUploadOptions = (data: unknown) =>
  mediaUploadOptionsSchema.safeParse(data);
export const validateCreateFolderData = (data: unknown) => createFolderDataSchema.safeParse(data);
export const validateUpdateFolderData = (data: unknown) => updateFolderDataSchema.safeParse(data);
export const validateMediaFilters = (data: unknown) => mediaFiltersSchema.safeParse(data);
export const validateMedia = (data: unknown) => mediaSchema.safeParse(data);
export const validateMediaFolder = (data: unknown) => mediaFolderSchema.safeParse(data);
export const validateMediaTag = (data: unknown) => mediaTagSchema.safeParse(data);
