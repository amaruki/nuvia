import { PlayCircle, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Course } from "@/types/learning.types";
import { moduleDuration } from "./course-helpers";

interface CurriculumTabProps {
  course: Course;
}

export function CurriculumTab({ course }: CurriculumTabProps) {
  return (
    <TabsContent value="curriculum" className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Course Content</h3>
          <p className="text-sm text-muted-foreground">
            {course.modules?.length ?? 0} sections •{" "}
            {course.modules?.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0} lectures
            • {course.duration} total length
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-primary/10 hover:text-primary"
        >
          Expand all sections
        </Button>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full border rounded-lg overflow-hidden bg-card"
      >
        {course.modules?.map((module) => (
          <AccordionItem key={module.id} value={module.id} className="border-b last:border-0">
            <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 bg-muted/20 data-[state=open]:bg-muted/50">
              <div className="text-left">
                <div className="font-semibold text-base">{module.title}</div>
                <div className="text-xs font-normal text-muted-foreground mt-1">
                  {module.lessons.length} lectures • {moduleDuration(module)}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 border-b last:border-0 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {lesson.type === "video" ? (
                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm cursor-pointer hover:underline">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {lesson.isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}

        {(!course.modules || course.modules.length === 0) && (
          <div className="p-8 text-center text-muted-foreground">
            Curriculum details not available for this course yet.
          </div>
        )}
      </Accordion>
    </TabsContent>
  );
}
