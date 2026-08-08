import { Award, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabsContent } from "@/components/ui/tabs";
import type { Course } from "@/types/learning.types";

interface InstructorTabProps {
  course: Course;
}

export function InstructorTab({ course }: InstructorTabProps) {
  return (
    <TabsContent value="instructor" className="space-y-6 animate-fadeInUp">
      {course.instructor ? (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={course.instructor.avatar} />
              <AvatarFallback className="text-xl">
                {course.instructor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-xl font-bold hover:underline cursor-pointer text-primary">
                  {course.instructor.name}
                </h3>
                <p className="text-muted-foreground font-medium">{course.instructor.role}</p>
              </div>
              {(course.instructor.coursesCount !== undefined ||
                course.instructor.studentsCount !== undefined) && (
                <div className="flex items-center gap-6 text-sm">
                  {course.instructor.coursesCount !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>{course.instructor.coursesCount} Courses</span>
                    </div>
                  )}
                  {course.instructor.studentsCount !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{course.instructor.studentsCount.toLocaleString()} Students</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm leading-relaxed">{course.instructor.bio}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>Instructor info not available.</p>
      )}
    </TabsContent>
  );
}
