import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  Gift,
  Shield,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";

export const getTypeIcon = (type: string) => {
  const iconMap = {
    general: Bell,
    event: Calendar,
    policy: Shield,
    maintenance: Zap,
    holiday: Gift,
    reminder: Clock,
    urgent: AlertTriangle,
    update: Target,
    banner: Gift,
    feature: Star,
    security: Shield,
    celebration: Star,
    emergency: AlertTriangle,
  };
  return iconMap[type as keyof typeof iconMap] || Bell;
};

export const getTargetAudienceIcon = (audience: string) => {
  const iconMap = {
    all_members: Users,
    chapter_admins: Shield,
    staff_only: Shield,
    public: Users,
    premium_members: Star,
  };
  return iconMap[audience as keyof typeof iconMap] || Users;
};
