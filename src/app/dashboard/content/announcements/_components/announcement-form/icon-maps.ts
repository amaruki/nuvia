import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  Bell,
  Building,
  Calendar as CalendarLucide,
  Crown,
  Gift,
  Globe,
  Layout,
  Lock,
  Megaphone,
  Minus,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  AnnouncementPriority,
  AnnouncementTargetAudience,
  AnnouncementType,
} from "@/types/announcement";

export const TYPE_ICON_MAP: Record<AnnouncementType, LucideIcon> = {
  general: Megaphone,
  event: CalendarLucide,
  policy: Shield,
  maintenance: Settings,
  feature: Star,
  security: Lock,
  reminder: Bell,
  celebration: Gift,
  emergency: AlertTriangle,
  banner: Layout,
};

export const PRIORITY_ICON_MAP: Record<AnnouncementPriority, LucideIcon> = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: AlertTriangle,
};

export const AUDIENCE_ICON_MAP: Record<AnnouncementTargetAudience, LucideIcon> = {
  all_members: Users,
  specific_chapters: Building,
  specific_committees: Users2,
  premium_members: Crown,
  chapter_admins: ShieldCheck,
  committee_chairs: Award,
  staff_only: UserCheck,
  public: Globe,
};
