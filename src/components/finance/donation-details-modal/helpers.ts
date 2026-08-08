import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  Gift,
  HandHeart,
  Repeat,
  User,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Donation } from "@/types/finance";

export interface DonationStatusBadge {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: LucideIcon;
  text: string;
  color: string;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStatusBadge = (status: Donation["status"]): DonationStatusBadge => {
  switch (status) {
    case "completed":
      return {
        variant: "default",
        icon: CheckCircle,
        text: "Completed",
        color: "text-green-600",
      };
    case "pending":
      return {
        variant: "secondary",
        icon: Clock,
        text: "Pending",
        color: "text-yellow-600",
      };
    case "failed":
      return {
        variant: "destructive",
        icon: XCircle,
        text: "Failed",
        color: "text-red-600",
      };
    case "refunded":
      return {
        variant: "outline",
        icon: AlertCircle,
        text: "Refunded",
        color: "text-orange-600",
      };
    case "pledged":
      return {
        variant: "secondary",
        icon: HandHeart,
        text: "Pledged",
        color: "text-blue-600",
      };
    default:
      return { variant: "secondary", icon: Clock, text: status, color: "text-gray-600" };
  }
};

export const getDonorTypeIcon = (donorType: Donation["donorType"]): LucideIcon => {
  switch (donorType) {
    case "individual":
      return User;
    case "organization":
      return Building;
    case "anonymous":
      return UserX;
    default:
      return User;
  }
};

export const getDonationTypeIcon = (donationType: Donation["donationType"]): LucideIcon => {
  switch (donationType) {
    case "one_time":
      return Gift;
    case "recurring":
      return Repeat;
    case "pledge":
      return HandHeart;
    default:
      return Gift;
  }
};
