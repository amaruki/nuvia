import { PlayCircle, BookOpen, FileText, Award, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { Course } from "@/types/learning.types";

interface CourseSidebarCardProps {
  course: Course;
}

export function CourseSidebarCard({ course }: CourseSidebarCardProps) {
  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-6 overflow-hidden border-border/50 shadow-lg">
        <div className="relative">
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img src={course.image} alt={course.title} className="object-cover w-full h-full" />
            <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-40`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-background/30 backdrop-blur-sm p-3 cursor-pointer hover:scale-110 transition-transform">
                <PlayCircle className="h-10 w-10 text-white fill-white/20" />
              </div>
            </div>
          </AspectRatio>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            {course.progress > 0 ? (
              <>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span>Your Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
                <Button className="w-full mt-2">Continue Learning</Button>
              </>
            ) : (
              <Button className="w-full size-lg text-lg font-semibold shadow-md">
                Start Course
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">This course includes:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
                <span>{course.duration} on-demand video</span>
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>Downloadable resources</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Full lifetime access</span>
              </li>
              <li className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>Certificate of completion</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" size="sm">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button variant="outline" className="flex-1" size="sm">
              <Heart className="h-4 w-4 mr-2" /> Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
