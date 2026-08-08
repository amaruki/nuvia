import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  PublicationAuthor,
  PublicationCategory,
  PublicationFormData,
  PublicationStatus,
  PublicationType,
} from "@/types/publication.types";
import { categoryOptions, difficultyOptions, statusOptions, typeOptions } from "./options";
import { PublicationForm } from "./types";

interface BasicInfoTabProps {
  form: PublicationForm;
  authors: PublicationAuthor[];
  watchTitle: string;
  generateSlug: (title: string) => string;
}

export function BasicInfoTab({ form, authors, watchTitle, generateSlug }: BasicInfoTabProps) {
  return (
    <TabsContent value="basic" className="mt-0 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Enter publication title"
            className={cn(form.formState.errors.title && "border-destructive")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">
              {form.formState.errors.title.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...form.register("slug")}
            placeholder="publication-url-slug"
            value={watchTitle ? generateSlug(watchTitle) : form.watch("slug")}
            onChange={(e) => form.setValue("slug", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt *</Label>
        <Textarea
          id="excerpt"
          {...form.register("excerpt")}
          placeholder="Brief description of the publication"
          rows={3}
          className={cn(form.formState.errors.excerpt && "border-destructive")}
        />
        {form.formState.errors.excerpt && (
          <p className="text-sm text-destructive">
            {form.formState.errors.excerpt.message as string}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as PublicationType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value as PublicationCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as PublicationStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="authorId">Primary Author *</Label>
          <Select
            value={form.watch("authorId")}
            onValueChange={(value) => form.setValue("authorId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select author" />
            </SelectTrigger>
            <SelectContent>
              {authors.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={form.watch("difficulty")}
            onValueChange={(value) =>
              form.setValue("difficulty", value as PublicationFormData["difficulty"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </TabsContent>
  );
}
