import { formatDistanceToNow } from "date-fns";

export const formatDate = (date: Date | string | null) => {
  if (!date) return "N/A";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isExpired = (expiresAt: Date | string | null) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};
