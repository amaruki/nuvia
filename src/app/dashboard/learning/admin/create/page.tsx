"use client";

import { CourseForm } from "../_components/course-form";

export default function CreateCoursePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Course</h1>
                <p className="text-muted-foreground">
                    Add a new course to your catalog.
                </p>
            </div>
            <CourseForm />
        </div>
    );
}
