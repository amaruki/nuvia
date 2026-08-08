"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { ArticleAuthor, ArticleFormData } from "@/types/article";
import { useArticles } from "@/lib/hooks/use-articles";
import { formSchema } from "./schema";
import type { ArticleForm } from "./types";

export interface ArticleEditorForm {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  featuredImage: string;
  setFeaturedImage: Dispatch<SetStateAction<string>>;
  gallery: string[];
  setGallery: Dispatch<SetStateAction<string[]>>;
  authors: ArticleAuthor[];
  form: ArticleForm;
  handleSubmit: (data: ArticleFormData) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleGalleryUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  generateSlug: (title: string) => string;
  watchTitle: string;
  watchContent: string;
}

export function useArticleForm(
  onSubmit: (data: ArticleFormData) => void,
  initialData?: Partial<ArticleFormData>,
): ArticleEditorForm {
  const [activeTab, setActiveTab] = useState("basic");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Author choices come from the real articles (backlog F2): the content
  // API stores authors on each item, so existing authors are the honest
  // source. This hook instance shares the content query cache with the
  // page's own useArticles call.
  const { filteredArticles } = useArticles();
  const authors = Array.from(
    new Map(filteredArticles.map((article) => [article.author.id, article.author])).values(),
  );

  const form = useForm<z.input<typeof formSchema>, unknown, ArticleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      type: "tutorial",
      category: "technology",
      format: "standard",
      difficulty: "beginner",
      status: "draft",
      authorId: "",
      coAuthorIds: [],
      reviewerId: "",
      tagIds: [],
      seriesId: "",
      visibility: "public",
      commentsEnabled: true,
      sharingEnabled: true,
      downloadEnabled: true,
      isFeatured: false,
      isPinned: false,
      priority: 5,
      seo: {
        title: "",
        description: "",
        keywords: [],
        ogImage: "",
      },
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
      if (initialData.featuredImage) setFeaturedImage(initialData.featuredImage);
      if (initialData.gallery) setGallery(initialData.gallery);
    }
  }, [initialData, form]);

  const handleSubmit = (data: ArticleFormData) => {
    const formDataWithMedia: ArticleFormData = {
      ...data,
      featuredImage,
      gallery,
      attachments,
    };
    onSubmit(formDataWithMedia);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFeaturedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setGallery((prev) => [...prev, e.target?.result as string]);
        reader.readAsDataURL(file);
      }
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const watchTitle = form.watch("title");
  const watchContent = form.watch("content");

  return {
    activeTab,
    setActiveTab,
    featuredImage,
    setFeaturedImage,
    gallery,
    setGallery,
    authors,
    form,
    handleSubmit,
    handleImageUpload,
    handleGalleryUpload,
    generateSlug,
    watchTitle,
    watchContent,
  };
}
