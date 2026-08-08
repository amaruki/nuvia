import * as z from "zod";

export const workspaceFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  type: z.enum(["general", "project", "document", "discussion", "meeting"] as const),
  settings: z.object({
    isPublic: z.boolean(),
    allowGuestAccess: z.boolean(),
    requireApproval: z.boolean(),
    enableNotifications: z.boolean(),
    autoArchiveDays: z
      .number()
      .min(1, "Auto archive must be at least 1 day")
      .max(1095, "Auto archive must be less than 3 years"),
    maxFileSize: z
      .number()
      .min(1, "Max file size must be at least 1MB")
      .max(1000, "Max file size must be less than 1000MB"),
    allowedFileTypes: z.array(z.string()).min(1, "At least one file type must be allowed"),
    memberPermissions: z
      .array(
        z.object({
          role: z.enum([
            "chair",
            "co_chair",
            "secretary",
            "treasurer",
            "member",
            "advisor",
          ] as const),
          permissions: z.array(
            z.enum([
              "view",
              "edit",
              "delete",
              "upload",
              "download",
              "manage_members",
              "manage_settings",
            ] as const),
          ),
        }),
      )
      .min(1, "At least one permission set is required"),
  }),
});

export type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;
