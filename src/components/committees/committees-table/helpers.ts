import { AlertTriangle, Briefcase, CheckSquare, Clock } from "lucide-react";

export const getStatusIcon = (status: string) => {
  const iconMap = {
    active: CheckSquare,
    inactive: Briefcase,
    pending: Clock,
    suspended: AlertTriangle,
  };
  return iconMap[status as keyof typeof iconMap] || Clock;
};

export const getStatusIconColor = (status: string) => {
  const colorMap = {
    active: "text-emerald-500",
    inactive: "text-rose-500",
    pending: "text-amber-500",
    suspended: "text-rose-500",
  };
  return colorMap[status as keyof typeof colorMap] || "text-gray-500";
};
