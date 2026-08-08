"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCourse } from "@/lib/hooks/use-learning-courses";
import { CourseHeader } from "./_components/course-header";
import { CourseSidebarCard } from "./_components/course-sidebar-card";
import { CourseLoading, CourseNotFound } from "./_components/course-states";
import { CurriculumTab } from "./_components/curriculum-tab";
import { InstructorTab } from "./_components/instructor-tab";
import { ReviewsTab } from "./_components/reviews-tab";
import { OverviewTab } from "./_components/overview-tab";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const courseId = params.courseId as string;
  const { data: course, isPending } = useCourse(courseId);

  useEffect(() => {
    if (course) {
      setHeader({
        title: course.title,
        description: course.description,
      });
    }

    return () => {
      clearHeader();
    };
  }, [course, setHeader, clearHeader]);

  if (isPending) {
    return <CourseLoading />;
  }

  if (!course) {
    return <CourseNotFound onBack={() => router.back()} />;
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Course Header / Hero Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        <CourseHeader course={course} />
        <CourseSidebarCard course={course} />
      </div>

      <Separator />

      {/* Main Content Tabs */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 space-x-6">
              <TabsTrigger
                value="curriculum"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Curriculum
              </TabsTrigger>
              <TabsTrigger
                value="instructor"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Instructor
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3"
              >
                Overview
              </TabsTrigger>
            </TabsList>

            <CurriculumTab course={course} />
            <InstructorTab course={course} />
            <ReviewsTab course={course} />
            <OverviewTab course={course} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
