"use client";

/**
 * My Courses (backlog UI-35): the caller's own enrollments with honest
 * progress from the `course_enrollments` rows — no fabricated completions.
 * Canceled enrollments never appear here (the API excludes them); unenrolling
 * keeps the row as history and removes the course from this list.
 */

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useHeader } from "@/contexts/dashboard-context";
import { useMyEnrollments } from "@/lib/hooks/use-learning-enrollments";

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  enrolled: "Enrolled",
  completed: "Completed",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function MyCoursesPage() {
  const { setHeader, clearHeader } = useHeader();
  const { enrolledCourses, loading, error, unenroll, unenrolling } = useMyEnrollments();

  useEffect(() => {
    setHeader({
      title: "My Courses",
      description: "Courses you are enrolled in, with your real progress.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenroll(courseId);
    } catch {
      // The hook surfaces the error toast; nothing else to do here.
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {loading && (
        <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
          Loading your courses…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load your enrollments: {error}
        </div>
      )}

      {!loading && !error && enrolledCourses.length === 0 && (
        <div className="text-center py-16 border rounded-lg bg-card">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-foreground/30" />
          <h3 className="font-medium text-foreground/80 mb-1">No enrollments yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You haven&apos;t enrolled in any courses. Browse the catalog to find your first one.
          </p>
          <Button asChild>
            <Link href="/dashboard/learning/courses">Browse the catalog</Link>
          </Button>
        </div>
      )}

      {!loading && !error && enrolledCourses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledCourses.map(({ enrollment, course }) => (
            <Card key={enrollment.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5 h-auto">
                    {course.category}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] px-2 py-0.5 h-auto">
                    {course.level}
                  </Badge>
                  <Badge
                    variant={enrollment.status === "completed" ? "default" : "secondary"}
                    className="text-[11px] px-2 py-0.5 h-auto ml-auto"
                  >
                    {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  <Link
                    href={`/dashboard/learning/courses/${course.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {course.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>
                    {enrollment.status === "completed"
                      ? "Completed"
                      : `${enrollment.progress}% complete`}
                  </span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </CardContent>

              <CardFooter className="pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Enrolled {DATE_FORMAT.format(new Date(enrollment.enrolledAt))}
                  </span>
                  {enrollment.completedAt && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Completed {DATE_FORMAT.format(new Date(enrollment.completedAt))}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={unenrolling}
                    onClick={() => void handleUnenroll(course.id)}
                  >
                    Unenroll
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/learning/courses/${course.id}`}>
                      {enrollment.status === "completed" ? "Review lessons" : "Open lessons"}
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
