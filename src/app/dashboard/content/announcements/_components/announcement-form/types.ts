import type { UseFormReturn } from "react-hook-form";

import type {
  AnnouncementFormInput,
  AnnouncementFormValues,
} from "@/lib/validation/content.validation";
import type { ArticleAuthor } from "@/types/article";
import type { Attachment } from "@/types/announcement";

export type AnnouncementForm = UseFormReturn<
  AnnouncementFormInput,
  unknown,
  AnnouncementFormValues
>;

export interface AnnouncementFormSectionProps {
  form: AnnouncementForm;
}

export interface ContentSectionProps extends AnnouncementFormSectionProps {
  authors: ArticleAuthor[];
}

export interface NewAttachment {
  name: string;
  url: string;
  type: "document";
}

export interface AttachmentsSectionProps {
  attachments: Attachment[];
  newAttachment: NewAttachment;
  onNewAttachmentChange: (value: NewAttachment) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (id: string) => void;
}
