"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Clock,
    Users,
    Star,
    BookOpen,
    PlayCircle,
    FileText,
    CheckCircle,
    Share2,
    Heart,
    Award,
    Globe,
    MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import { courses } from "../_data/mock-data";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = Number(params.courseId);
    const course = courses.find(c => c.id === courseId);

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
                <p className="text-muted-foreground mb-4">The course you are looking for does not exist.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeInUp">
            {/* Course Header / Hero Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge>{course.category}</Badge>
                            <Badge variant="outline">{course.level}</Badge>
                            {course.updatedAt && (
                                <span className="text-xs text-muted-foreground ml-auto">Updated {course.updatedAt}</span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{course.title}</h1>
                        <p className="text-lg text-muted-foreground">{course.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-amber-500 fill-current" />
                                <span className="font-medium text-foreground">{course.rating}</span>
                                <span>(128 ratings)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{course.students.toLocaleString()} students</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Globe className="h-4 w-4" />
                                <span>English</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={course.instructor?.avatar} />
                            <AvatarFallback>{course.instructor?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">Created by <span className="text-primary hover:underline cursor-pointer">{course.instructor?.name || "Unknown Instructor"}</span></p>
                        </div>
                    </div>
                </div>

                {/* Floating Sidebar Card */}
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
                                        <span>85 downloadable resources</span>
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

                        <TabsContent value="curriculum" className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">Course Content</h3>
                                    <p className="text-sm text-muted-foreground">5 sections • 18 lectures • {course.duration} total length</p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary">Expand all sections</Button>
                            </div>

                            <Accordion type="single" collapsible className="w-full border rounded-lg overflow-hidden bg-card">
                                {course.modules?.map((module) => (
                                    <AccordionItem key={module.id} value={module.id} className="border-b last:border-0">
                                        <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 bg-muted/20 data-[state=open]:bg-muted/50">
                                            <div className="text-left">
                                                <div className="font-semibold text-base">{module.title}</div>
                                                <div className="text-xs font-normal text-muted-foreground mt-1">
                                                    {module.lessons.length} lectures • 45min
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">
                                            {module.lessons.map((lesson) => (
                                                <div key={lesson.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 border-b last:border-0 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {lesson.type === 'video' ? <PlayCircle className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                                                        <span className="text-sm cursor-pointer hover:underline">{lesson.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {lesson.isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                                                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}

                                {!course.modules && (
                                    <div className="p-8 text-center text-muted-foreground">Curriculum details not available for this course yet.</div>
                                )}
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="instructor" className="space-y-6 animate-fadeInUp">
                            {course.instructor ? (
                                <div className="bg-card border rounded-lg p-6">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <Avatar className="h-24 w-24">
                                            <AvatarImage src={course.instructor.avatar} />
                                            <AvatarFallback className="text-xl">{course.instructor.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-4 flex-1">
                                            <div>
                                                <h3 className="text-xl font-bold hover:underline cursor-pointer text-primary">{course.instructor.name}</h3>
                                                <p className="text-muted-foreground font-medium">{course.instructor.role}</p>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                                    <span>4.8 Rating</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Award className="h-4 w-4 text-muted-foreground" />
                                                    <span>{course.instructor.coursesCount} Courses</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>{course.instructor.studentsCount.toLocaleString()} Students</span>
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed">{course.instructor.bio}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p>Instructor info not available.</p>
                            )}
                        </TabsContent>

                        <TabsContent value="reviews" className="space-y-6">
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-xl font-bold mb-6">Student Feedback</h3>
                                <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
                                    <div className="text-center md:text-left">
                                        <div className="text-5xl font-bold text-primary mb-2">{course.rating}</div>
                                        <div className="flex justify-center md:justify-start gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`h-5 w-5 ${s <= Math.round(course.rating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-muted-foreground">Course Rating</p>
                                    </div>

                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map((rating, i) => (
                                            <div key={rating} className="flex items-center gap-2">
                                                <Progress value={[70, 20, 5, 2, 3][i]} className="h-2" />
                                                <div className="flex items-center w-24 gap-1 text-sm text-muted-foreground">
                                                    <div className="flex text-amber-500">
                                                        {[...Array(5)].map((_, starIndex) => (
                                                            <Star key={starIndex} className={`h-3 w-3 ${starIndex < rating ? "fill-current" : "text-transparent"}`} />
                                                        ))}
                                                    </div>
                                                    <span className="ml-auto">{[70, 20, 5, 2, 3][i]}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="space-y-6">
                                    {course.reviews?.map((review) => (
                                        <div key={review.id} className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={review.user.avatar} />
                                                    <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-sm">{review.user.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-amber-500">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-current" : "text-muted/30"}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{review.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground pl-14">{review.comment}</p>
                                            <Separator className="mt-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="overview">
                            <div className="bg-card border rounded-lg p-6 space-y-4">
                                <h3 className="text-xl font-bold">What you'll learn</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {course.features?.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                        <span>Detailed explanation of concepts</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mt-8">Description</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {course.longDescription || course.description}
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
