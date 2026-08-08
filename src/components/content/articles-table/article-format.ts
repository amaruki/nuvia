export const formatDate = (date: Date | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

export const getEngagementColor = (score: number) => {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
};
