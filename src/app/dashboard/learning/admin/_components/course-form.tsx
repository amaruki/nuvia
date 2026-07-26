"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import {
  Save,
  Loader2,
  Plus,
  Trash,
  GripVertical,
  Video,
  FileText,
  HelpCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { Course } from "../../courses/_types";
import { logger } from "@/lib/logger";

const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Lesson title is required"),
  duration: z.string().min(1, "Duration is required"),
  type: z.enum(["video", "article", "quiz"]),
  isCompleted: z.boolean().optional(),
});

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title is required"),
  lessons: z.array(lessonSchema),
});

const courseFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  image: z
    .string()
    .url({
      message: "Please look for a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  modules: z.array(moduleSchema).optional(),
});

type CourseFormValues = z.output<typeof courseFormSchema>;
type CourseFormInput = z.input<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Course | null;
}

export function CourseForm({ initialData }: CourseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  // This would handle submission to API
  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    // Simulate API call
    logger.info("Submitting Course Data", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push("/dashboard/learning/admin");
    router.refresh();
  };

  const form = useForm<CourseFormInput, any, CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          category: initialData.category,
          level: initialData.level,
          image: initialData.image,
          price: initialData.price || 0,
          modules:
            initialData.modules?.map((m) => ({
              id: m.id,
              title: m.title,
              lessons: m.lessons.map((l) => ({
                id: l.id,
                title: l.title,
                duration: l.duration,
                type: l.type,
                isCompleted: l.isCompleted,
              })),
            })) || [],
        }
      : {
          title: "",
          description: "",
          category: "",
          level: "Beginner",
          image: "",
          price: 0,
          modules: [],
        },
  });

  const {
    fields: moduleFields,
    append: appendModule,
    remove: removeModule,
  } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-fadeInUp">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General details about your course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Advanced React Patterns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of what students will learn..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Data Science">Data Science</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value as number}
                        />
                      </FormControl>
                      <FormDescription>Set to 0 for free courses.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Curriculum Builder</CardTitle>
                <CardDescription>Organize your course into modules and lessons.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {moduleFields.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/5">
                    <p className="text-muted-foreground mb-4">No modules added yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendModule({ title: "New Module", lessons: [] })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Start Adding Modules
                    </Button>
                  </div>
                )}

                <Accordion type="multiple" className="space-y-4">
                  {moduleFields.map((field, index) => (
                    <ModuleItem
                      key={field.id}
                      index={index}
                      form={form}
                      removeModule={removeModule}
                    />
                  ))}
                </Accordion>

                {moduleFields.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full border-dashed"
                    onClick={() => appendModule({ title: "New Module", lessons: [] })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Module
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Course"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

// Sub-component for Module Item to handle dragging/nested lessons cleaner if needed
// For now kept inline logic or separated for cleanliness
function ModuleItem({
  index,
  form,
  removeModule,
}: {
  index: number;
  form: any;
  removeModule: (index: number) => void;
}) {
  const {
    fields: lessonFields,
    append: appendLesson,
    remove: removeLesson,
  } = useFieldArray({
    control: form.control,
    name: `modules.${index}.lessons`,
  });

  return (
    <AccordionItem value={`item-${index}`} className="border rounded-lg bg-card px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1 rounded">
              <GripVertical className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">
              {form.watch(`modules.${index}.title`) || `Module ${index + 1}`}
            </span>
            <Badge variant="secondary" className="ml-2 text-xs font-normal">
              {lessonFields.length} Lessons
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FormField
            control={form.control}
            name={`modules.${index}.title`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Module Title" {...field} className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              removeModule(index);
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 pl-4 border-l-2 border-border ml-2">
          {lessonFields.map((lesson, lessonIndex) => (
            <div key={lesson.id} className="flex items-start gap-2 group">
              <div className="mt-2.5">
                {form.watch(`modules.${index}.lessons.${lessonIndex}.type`) === "video" && (
                  <Video className="h-4 w-4 text-muted-foreground" />
                )}
                {form.watch(`modules.${index}.lessons.${lessonIndex}.type`) === "article" && (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                {form.watch(`modules.${index}.lessons.${lessonIndex}.type`) === "quiz" && (
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="grid grid-cols-12 gap-2 flex-1">
                <div className="col-span-6">
                  <FormField
                    control={form.control}
                    name={`modules.${index}.lessons.${lessonIndex}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Lesson Title" {...field} className="h-8 text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`modules.${index}.lessons.${lessonIndex}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`modules.${index}.lessons.${lessonIndex}.duration`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Time" {...field} className="h-8 text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeLesson(lessonIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 p-0 h-auto font-normal text-xs flex items-center gap-1 mt-2"
            onClick={() => appendLesson({ title: "", duration: "", type: "video" })}
          >
            <Plus className="h-3 w-3" /> Add Lesson
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
