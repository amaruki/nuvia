"use client";

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
import type {
  ArticleType,
  ArticleCategory,
  ArticleFormat,
  ArticleDifficulty,
  ArticleStatus,
} from "@/types/article";
import {
  TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  FORMAT_OPTIONS,
  DIFFICULTY_OPTIONS,
  STATUS_OPTIONS,
} from "./options";
import type { BasicInfoSectionProps } from "./types";

export default function BasicInfoSection({
  form,
  authors,
  watchTitle,
  generateSlug,
}: BasicInfoSectionProps) {
  return (
    <TabsContent value="basic" className="mt-0 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Enter article title"
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
            placeholder="article-url-slug"
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
          placeholder="Brief description of the article"
          rows={3}
          className={cn(form.formState.errors.excerpt && "border-destructive")}
        />
        {form.formState.errors.excerpt && (
          <p className="text-sm text-destructive">
            {form.formState.errors.excerpt.message as string}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as ArticleType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
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
            onValueChange={(value) => form.setValue("category", value as ArticleCategory)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">Format *</Label>
          <Select
            value={form.watch("format")}
            onValueChange={(value) => form.setValue("format", value as ArticleFormat)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              {FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty *</Label>
          <Select
            value={form.watch("difficulty")}
            onValueChange={(value) => form.setValue("difficulty", value as ArticleDifficulty)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map((option) => (
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
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as ArticleStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
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
