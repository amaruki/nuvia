import { PublicationCategory, PublicationStatus, PublicationType } from "@/types/publication";

export const typeOptions: { value: PublicationType; label: string }[] = [
  { value: "article", label: "Article" },
  { value: "blog", label: "Blog Post" },
  { value: "newsletter", label: "Newsletter" },
  { value: "report", label: "Report" },
  { value: "case_study", label: "Case Study" },
];

export const categoryOptions: { value: PublicationCategory; label: string }[] = [
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "research", label: "Research" },
];

export const statusOptions: { value: PublicationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
];

export const difficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const visibilityOptions = [
  { value: "public", label: "Public" },
  { value: "members_only", label: "Members Only" },
];
