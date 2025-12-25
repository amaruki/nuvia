"use client";

import { useState } from "react";
import {
  Trophy,
  Target,
  Search,
  Filter
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { courses, stats } from "./_data/mock-data";
import { CourseCard } from "./_components/course-card";
import { CourseStats } from "./_components/course-stats";
import { EmptyState } from "./_components/empty-state";

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || course.level.toLowerCase() === difficultyFilter.toLowerCase();

    if (activeTab === "in-progress") return matchesSearch && matchesDifficulty && course.progress > 0 && course.progress < 100;
    if (activeTab === "completed") return matchesSearch && matchesDifficulty && course.progress === 100;
    if (activeTab === "saved") return matchesSearch && matchesDifficulty && false; // Mock saved property
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Center</h1>
          <p className="text-muted-foreground mt-1">
            Expand your skills with our curated courses and workshops.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Trophy className="h-4 w-4" />
            My Certificates
          </Button>
          <Button className="gap-2">
            <Target className="h-4 w-4" />
            Learning Path
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <CourseStats stats={stats} />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="flex-1 sm:flex-none">All Courses</TabsTrigger>
                <TabsTrigger value="in-progress" className="flex-1 sm:flex-none">In Progress</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 sm:flex-none">Completed</TabsTrigger>
                <TabsTrigger value="saved" className="flex-1 sm:flex-none">Saved</TabsTrigger>
              </TabsList>

              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Difficulty" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
                {filteredCourses.length === 0 && (
                  <EmptyState
                    title="No courses found"
                    description="Try adjusting your search or filters to find what you're looking for."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
                {filteredCourses.length === 0 && (
                  <EmptyState
                    title="No courses in progress"
                    description="Start learning today! Browse our catalog to find your first course."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
                {filteredCourses.length === 0 && (
                  <EmptyState
                    title="No completed courses yet"
                    description="Keep learning! Your achievements will appear here once you finish a course."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="saved" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
                {filteredCourses.length === 0 && (
                  <EmptyState
                    title="No saved courses"
                    description="Save interesting courses to watch later."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}