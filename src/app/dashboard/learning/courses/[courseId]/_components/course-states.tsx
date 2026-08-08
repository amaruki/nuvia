import { Button } from "@/components/ui/button";

export function CourseLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] text-sm text-muted-foreground">
      Loading course…
    </div>
  );
}

interface CourseNotFoundProps {
  onBack: () => void;
}

export function CourseNotFound({ onBack }: CourseNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
      <p className="text-muted-foreground mb-4">The course you are looking for does not exist.</p>
      <Button onClick={onBack}>Go Back</Button>
    </div>
  );
}
