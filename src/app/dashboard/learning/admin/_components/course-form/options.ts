import type { CourseLevel, LessonType } from "./schema";

export const categoryOptions: { value: string; label: string }[] = [
  { value: "Development", label: "Development" },
  { value: "Design", label: "Design" },
  { value: "Business", label: "Business" },
  { value: "Marketing", label: "Marketing" },
  { value: "Data Science", label: "Data Science" },
];

export const levelOptions: { value: CourseLevel; label: string }[] = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

export const lessonTypeOptions: { value: LessonType; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "quiz", label: "Quiz" },
];
