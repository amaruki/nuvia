import { cva } from "class-variance-authority";

const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-info",
      green: "bg-success",
      pink: "bg-chart-5",
      purple: "bg-accent-foreground",
      orange: "bg-warning",
      red: "bg-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dayEventVariants = cva(
  "font-medium border-l-4 rounded-md p-2 text-xs transition-all duration-200 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "bg-muted/40 text-foreground border-muted-foreground/50 hover:bg-muted/60",
        blue: "bg-info/10 text-foreground border-info hover:bg-info/20",
        green: "bg-success/10 text-foreground border-success hover:bg-success/20",
        pink: "bg-chart-5/10 text-foreground border-chart-5 hover:bg-chart-5/20",
        purple: "bg-accent/60 text-accent-foreground border-accent-foreground/40 hover:bg-accent",
        orange: "bg-warning/10 text-foreground border-warning hover:bg-warning/20",
        red: "bg-destructive/10 text-foreground border-destructive hover:bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export { monthEventVariants, dayEventVariants };
