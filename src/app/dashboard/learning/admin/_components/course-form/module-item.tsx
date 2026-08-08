import { useFieldArray } from "react-hook-form";
import { FileText, GripVertical, HelpCircle, Plus, Trash, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

import { lessonTypeOptions } from "./options";
import type { CourseFormInstance } from "./types";

// Sub-component for Module Item to handle dragging/nested lessons cleaner if needed
// For now kept inline logic or separated for cleanliness
export function ModuleItem({
  index,
  form,
  removeModule,
}: {
  index: number;
  form: CourseFormInstance;
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
                            {lessonTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
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
