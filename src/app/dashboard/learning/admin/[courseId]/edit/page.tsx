"use client";

import { useParams } from "next/navigation";
import { CourseForm } from "../../_components/course-form";
import { courses } from "../../../courses/_data/mock-data";

export default function EditCoursePage() {
    const params = useParams();
    const courseId = Number(params.courseId);
    const course = courses.find((c) => c.id === courseId);

    if (!course) {
        return <div>Course not found</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
                <p className="text-muted-foreground">
                    Update course details and curriculum.
                </p>
            </div>
            <CourseForm initialData={course} />
        </div>
    );
}
