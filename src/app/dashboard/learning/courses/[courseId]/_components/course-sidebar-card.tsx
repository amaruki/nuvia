"use client";

/**
 * Enrollment-aware course sidebar (backlog UI-35).
 *
 * Progress shown here is the caller's REAL enrollment progress from
 * `course_enrollments` — the catalog `Course.progress` stays a neutral 0 and
 * is never rendered. Lesson media for this catalog is not hosted in this
 * instance, so learning here means the member reports honest course-level
 * progress; the card says so instead of pretending a player exists.
 */

import { useState } from "react";
import { BadgeCheck, BookOpen, CalendarDays, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useMyEnrollments } from "@/lib/hooks/use-learning-enrollments";
import type { Course } from "@/types/learning.types";

interface CourseSidebarCardProps {
  course: Course;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function CourseSidebarCard({ course }: CourseSidebarCardProps) {
  const {
    enrolledCourses,
    enroll,
    enrolling,
    unenroll,
    unenrolling,
    updateProgress,
    updatingProgress,
  } = useMyEnrollments();
  const [draftProgress, setDraftProgress] = useState<number | null>(null);

  const enrollment =
    enrolledCourses.find((entry) => entry.course.id === course.id)?.enrollment ?? null;
  const progress = enrollment?.progress ?? 0;
  const sliderValue = draftProgress ?? progress;
  const sections = course.modules?.length ?? 0;
  const lessons = course.modules?.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0;

  const handleEnroll = async () => {
    try {
      await enroll(course.id);
    } catch {
      // The hook surfaces the error toast; nothing else to do here.
    }
  };

  const handleUnenroll = async () => {
    try {
      await unenroll(course.id);
      setDraftProgress(null);
    } catch {
      // The hook surfaces the error toast; nothing else to do here.
    }
  };

  const handleSave = async (value: number) => {
    try {
      await updateProgress(course.id, value);
      setDraftProgress(null);
    } catch {
      // The hook surfaces the error toast; nothing else to do here.
    }
  };

  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-6 overflow-hidden border-border/50 shadow-lg">
        <div className="relative">
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img src={course.image} alt={course.title} className="object-cover w-full h-full" />
            <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-40`} />
          </AspectRatio>
        </div>
        <CardContent className="p-6 space-y-6">
          {!enrollment ? (
            <div className="space-y-2">
              <Button
                className="w-full size-lg text-lg font-semibold shadow-md"
                disabled={enrolling}
                onClick={() => void handleEnroll()}
              >
                {enrolling ? "Enrolling…" : "Enroll in this course"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Enrollment tracks your course-level progress so you can pick up where you left off.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Your Progress</span>
                <span>{enrollment.status === "completed" ? "Completed" : `${progress}%`}</span>
              </div>
              <Progress value={progress} className="h-2" />

              <div className="space-y-2 pt-2">
                <label
                  htmlFor="enrollment-progress"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Update your progress: {sliderValue}%
                </label>
                <input
                  id="enrollment-progress"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={sliderValue}
                  disabled={updatingProgress}
                  onChange={(event) => setDraftProgress(Number(event.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    disabled={
                      updatingProgress || draftProgress === null || draftProgress === progress
                    }
                    onClick={() => void handleSave(sliderValue)}
                  >
                    Save progress
                  </Button>
                  <Button
                    className="flex-1"
                    size="sm"
                    variant="outline"
                    disabled={updatingProgress || progress === 100}
                    onClick={() => void handleSave(100)}
                  >
                    <BadgeCheck className="h-4 w-4 mr-1" />
                    Mark complete
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Enrolled {DATE_FORMAT.format(new Date(enrollment.enrolledAt))}
                </p>
                {enrollment.completedAt && (
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Completed {DATE_FORMAT.format(new Date(enrollment.completedAt))}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive"
                disabled={unenrolling}
                onClick={() => void handleUnenroll()}
              >
                {unenrolling ? "Unenrolling…" : "Unenroll from this course"}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground border-t pt-4">
            Lesson media for this catalog is not hosted in this instance — this outline is the
            course&apos;s real curriculum data, and progress is tracked at the course level.
          </p>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Course details</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>
                  {sections} {sections === 1 ? "section" : "sections"} • {lessons}{" "}
                  {lessons === 1 ? "lesson" : "lessons"}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{course.duration} curriculum outline</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
