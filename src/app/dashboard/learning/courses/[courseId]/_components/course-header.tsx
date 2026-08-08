import { Clock, Globe, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Course } from "@/types/learning.types";

interface CourseHeaderProps {
  course: Course;
}

export function CourseHeader({ course }: CourseHeaderProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge>{course.category}</Badge>
          <Badge variant="outline">{course.level}</Badge>
          {course.updatedAt && (
            <span className="text-xs text-muted-foreground ml-auto">
              Updated {course.updatedAt}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-current" />
            <span className="font-medium text-foreground">{course.rating}</span>
            <span>({course.reviews?.length ?? 0} reviews)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{course.students.toLocaleString()} students</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            <span>English</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={course.instructor?.avatar} />
          <AvatarFallback>{course.instructor?.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            Created by{" "}
            <span className="text-primary hover:underline cursor-pointer">
              {course.instructor?.name || "Unknown Instructor"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
