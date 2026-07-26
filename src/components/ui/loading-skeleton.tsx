import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps extends React.ComponentProps<typeof Skeleton> {}

export default function LoadingSkeleton({ className, ...props }: LoadingSkeletonProps) {
  return <Skeleton className={cn("w-[100px] h-[20px] rounded-full", className)} {...props} />;
}
