"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { CourseForm } from "../../_components/course-form";
import { courses } from "../../../courses/_data/mock-data";
import { useHeader } from "@/contexts/dashboard-context";

export default function EditCoursePage() {
  const params = useParams();
  const { setHeader, clearHeader } = useHeader();
  const courseId = Number(params.courseId);
  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    setHeader({
      title: "Edit Course",
      description: "Update course details and curriculum.",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="space-y-6">
      <CourseForm initialData={course} />
    </div>
  );
}
