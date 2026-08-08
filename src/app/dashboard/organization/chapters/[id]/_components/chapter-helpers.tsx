import { Badge } from "@/components/ui/badge";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  // lucide-react v1 dropped brand/logo icons — see TODO.md
  Users as Facebook,
  MessageCircle as Twitter,
  Link2 as Linkedin,
  Image as Instagram,
  Video as Youtube,
} from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "inactive":
      return <XCircle className="h-4 w-4 text-rose-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "suspended":
      return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export const getStatusBadge = (status: string) => {
  const variants = {
    active: "default" as const,
    inactive: "secondary" as const,
    pending: "outline" as const,
    suspended: "destructive" as const,
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const getFinancialHealthBadge = (health: string) => {
  const variants = {
    excellent: "default" as const,
    good: "secondary" as const,
    fair: "outline" as const,
    poor: "destructive" as const,
  };

  return (
    <Badge variant={variants[health as keyof typeof variants] || "secondary"}>
      {health.charAt(0).toUpperCase() + health.slice(1)}
    </Badge>
  );
};

export const getGrowthIcon = (rate: number) => {
  return rate >= 0 ? (
    <TrendingUp className="h-4 w-4 text-emerald-500" />
  ) : (
    <TrendingDown className="h-4 w-4 text-rose-500" />
  );
};

export const getGrowthColor = (rate: number) => {
  return rate >= 0 ? "text-emerald-600" : "text-rose-600";
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export const getSocialIcon = (platform: string) => {
  switch (platform) {
    case "facebook":
      return <Facebook className="h-4 w-4" />;
    case "twitter":
      return <Twitter className="h-4 w-4" />;
    case "linkedin":
      return <Linkedin className="h-4 w-4" />;
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    case "youtube":
      return <Youtube className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
};
