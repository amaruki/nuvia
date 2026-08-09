export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "Development":
      return "bg-chart-1/20 text-chart-1";
    case "Design":
      return "bg-chart-4/20 text-chart-4";
    case "Technology":
      return "bg-chart-2/20 text-chart-2";
    case "Accessibility":
      return "bg-chart-3/20 text-chart-3";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};
