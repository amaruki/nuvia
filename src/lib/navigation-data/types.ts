import type { UserRole } from "@/types/dashboard.types";

export interface NavItemData {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly badge?: string | null;
  readonly roles?: UserRole[];
  readonly category?: "main" | "personal" | "admin" | "system";
  readonly subItems?: readonly NavItemData[];
}
