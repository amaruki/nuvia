export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getSuccessRateColor = (rate: number): string => {
  if (rate >= 95) return "text-emerald-600";
  if (rate >= 90) return "text-amber-600";
  return "text-rose-600";
};

export const getSuccessRateBadge = (rate: number): { className: string; text: string } => {
  if (rate >= 95)
    return {
      className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      text: "Excellent",
    };
  if (rate >= 90)
    return { className: "bg-amber-100 text-amber-700 hover:bg-amber-100", text: "Good" };
  return { className: "bg-rose-100 text-rose-700 hover:bg-rose-100", text: "Attention" };
};
