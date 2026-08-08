import { CheckCircle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import type { Course } from "@/types/learning.types";

interface OverviewTabProps {
  course: Course;
}

export function OverviewTab({ course }: OverviewTabProps) {
  return (
    <TabsContent value="overview">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-bold">What you'll learn</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {course.features?.map((feature, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold mt-8">Description</h3>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {course.longDescription || course.description}
        </p>
      </div>
    </TabsContent>
  );
}
