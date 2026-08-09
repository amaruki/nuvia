export const formatDate = (date: Date | undefined) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};
