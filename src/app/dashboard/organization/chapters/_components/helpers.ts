import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

export const getStatusIcon = (status: string) => {
  const iconMap = {
    active: CheckCircle2,
    inactive: XCircle,
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

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
