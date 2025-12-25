"use client";

import { useEffect } from "react";
import { CourseForm } from "../_components/course-form";
import { useHeader } from "@/contexts/dashboard-context";

export default function CreateCoursePage() {
    const { setHeader, clearHeader } = useHeader();

    useEffect(() => {
        setHeader({
            title: "Create Course",
            description: "Add a new course to your catalog.",
        });

        return () => {
            clearHeader();
        };
    }, [setHeader, clearHeader]);

    return (
        <div className="space-y-6">
            <CourseForm />
        </div>
    );
}
