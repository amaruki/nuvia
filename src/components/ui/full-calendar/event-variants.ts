import { cva } from "class-variance-authority";

const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
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
        blue: "bg-blue-50 text-blue-700 border-blue-500 hover:bg-blue-100",
        green: "bg-green-50 text-green-700 border-green-500 hover:bg-green-100",
        pink: "bg-pink-50 text-pink-700 border-pink-500 hover:bg-pink-100",
        purple: "bg-purple-50 text-purple-700 border-purple-500 hover:bg-purple-100",
        orange: "bg-orange-50 text-orange-700 border-orange-500 hover:bg-orange-100",
        red: "bg-red-50 text-red-700 border-red-500 hover:bg-red-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export { monthEventVariants, dayEventVariants };
