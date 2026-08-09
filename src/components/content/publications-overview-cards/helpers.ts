export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getEngagementColor = (score: number): string => {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-rose-600";
};

export const getEngagementBadge = (score: number): { className: string; text: string } => {
  if (score >= 85)
    return {
      className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      text: "Excellent",
    };
  if (score >= 70)
    return { className: "bg-amber-100 text-amber-700 hover:bg-amber-100", text: "Good" };
  return { className: "bg-rose-100 text-rose-700 hover:bg-rose-100", text: "Needs Improvement" };
};
