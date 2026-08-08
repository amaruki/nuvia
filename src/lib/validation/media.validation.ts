// Re-export shim: the media validation schemas moved to ./media-validation/,
// grouped into domain modules so each file stays within the 300-line limit.
// Existing imports of "@/lib/validation/media.validation" keep working unchanged.
export * from "./media-validation";
