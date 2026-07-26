import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Clock, Star, Users } from "lucide-react";
import { Course } from "../_types";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden card-hover border-border/50 bg-card/50 backdrop-blur-sm flex flex-col h-full">
      <div className="relative">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-60 z-10`} />
          <img
            src={course.image}
            alt={course.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 z-20">
            <Badge
              variant="secondary"
              className="bg-background/80 backdrop-blur text-xs font-semibold"
            >
              {course.category}
            </Badge>
          </div>
          <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
            >
              <Badge className="sr-only">Save</Badge>
              <Star className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/90 to-transparent opacity-80" />

          <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-end">
            {course.progress > 0 && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-secondary-foreground mb-1.5 font-medium">
                  <span>{course.progress}% Complete</span>
                </div>
                <Progress
                  value={course.progress}
                  className="h-1.5 bg-background/30 [&>div]:bg-primary"
                />
              </div>
            )}
          </div>
        </AspectRatio>
      </div>

      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant={
              course.level === "Advanced"
                ? "destructive"
                : course.level === "Intermediate"
                  ? "default"
                  : "secondary"
            }
            className="text-[10px] px-2 py-0.5 h-auto"
          >
            {course.level}
          </Badge>
          <div className="flex items-center text-amber-500 text-xs font-medium">
            <Star className="h-3.5 w-3.5 fill-current mr-1" />
            {course.rating}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs mt-2">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between text-muted-foreground text-xs border-t bg-muted/20">
        <div className="flex items-center gap-4 py-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {course.students}
          </div>
        </div>
        <Button
          size="sm"
          variant={course.progress > 0 ? "default" : "outline"}
          className="h-8 ml-auto"
        >
          {course.progress > 0 ? "Continue" : "Start"}
        </Button>
      </CardFooter>
    </Card>
  );
}
