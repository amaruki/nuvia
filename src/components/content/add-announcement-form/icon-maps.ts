import {
  Megaphone,
  Calendar as CalendarLucide,
  Shield,
  Settings,
  Star,
  Lock,
  Bell,
  Gift,
  AlertTriangle,
  Layout,
  Users,
  Building,
  Users2,
  Crown,
  ShieldCheck,
  Award,
  UserCheck,
  Globe,
  ArrowDown,
  Minus,
  ArrowUp,
} from "lucide-react";

export const TYPE_ICON_MAP = {
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

export const PRIORITY_ICON_MAP = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: AlertTriangle,
};

export const AUDIENCE_ICON_MAP = {
  all_members: Users,
  specific_chapters: Building,
  specific_committees: Users2,
  premium_members: Crown,
  chapter_admins: ShieldCheck,
  committee_chairs: Award,
  staff_only: UserCheck,
  public: Globe,
};
