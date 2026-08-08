/**
 * Learning & Development — shared UI contract types (backlog D3).
 *
 * Moved out of `src/app/dashboard/learning/courses/_types` so the service,
 * hooks, and pages share one definition (same arrangement as
 * chapter.types.ts). The API returns these shapes
 * directly, with dates as ISO strings until the hooks hydrate the display
 * labels the pages render (`Course.updatedAt`, `Certificate.issueDate`).
 */

import type { ElementType } from "react";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "article" | "quiz";
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  date: string;
  comment: string;
}

export interface Instructor {
  id?: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  signature?: string;
  /** Aggregate counts are unknown without an instructor entity — omitted until one exists. */
  coursesCount?: number;
  studentsCount?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  category: string;
  level: CourseLevel;
  duration: string;
  students: number;
  rating: number;
  /** Per-user progress (0–100). Stays 0 until enrollment tracking exists. */
  progress: number;
  image: string;
  /** Tailwind gradient stops for the card overlay, e.g. "from-blue-500 to-indigo-600". */
  color: string;
  instructor?: Instructor;
  modules?: Module[];
  reviews?: Review[];
  price?: number;
  features?: string[];
  /** Display label for the "Updated …" line (e.g. "March 2024"); hydrated from the wire ISO date. */
  updatedAt?: string;
}

export interface UserStat {
  label: string;
  value: string;
  icon: ElementType;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export type CertificateStatus = "active" | "revoked";

export interface Certificate {
  id: string;
  courseId: string | null;
  courseName: string;
  /** Display label (e.g. "March 15, 2024"); hydrated from the wire ISO date. */
  issueDate: string;
  /** Display label; hydrated from the wire ISO date when set. */
  expiryDate?: string;
  grade?: string;
  instructorName?: string;
  instructorSignature?: string;
  verificationCode: string;
  image: string;
  studentName: string;
  studentEmail: string;
  status: CertificateStatus;
}
