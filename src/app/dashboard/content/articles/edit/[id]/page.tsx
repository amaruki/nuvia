"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHeader } from "@/contexts/dashboard-context";
import { useArticles } from "@/lib/hooks/use-articles";
import { logger } from "@/lib/logger";
import AddArticleForm from "@/components/content/add-article-form";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleFormData } from "@/types/article";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { getArticle, updateArticle } = useArticles();

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = params.id as string;

  useEffect(() => {
    setHeader({
      title: "Edit Article",
      description: "Update and modify your existing article",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        const foundArticle = getArticle(articleId);
        if (foundArticle) {
          // Convert article to form data format
          const formData: Partial<ArticleFormData> = {
            title: foundArticle.title,
            slug: foundArticle.slug,
            excerpt: foundArticle.excerpt,
            content: foundArticle.content,
            type: foundArticle.type,
            category: foundArticle.category,
            format: foundArticle.format,
            difficulty: foundArticle.difficulty,
            status: foundArticle.status,
            authorId: foundArticle.author.id,
            coAuthorIds: foundArticle.coAuthors?.map((author) => author.id),
            reviewerId: foundArticle.reviewer?.id,
            tagIds: foundArticle.tags.map((tag) => tag.id),
            seriesId: foundArticle.series?.id,
            featuredImage: foundArticle.featuredImage,
            gallery: foundArticle.gallery,
            visibility: foundArticle.visibility,
            commentsEnabled: foundArticle.commentsEnabled,
            sharingEnabled: foundArticle.sharingEnabled,
            downloadEnabled: foundArticle.downloadEnabled,
            isFeatured: foundArticle.isFeatured,
            isPinned: foundArticle.isPinned,
            priority: foundArticle.priority,
            seo: foundArticle.seo,
          };

          setArticle(formData);
        } else {
          setError("Article not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      loadArticle();
    }
  }, [articleId, getArticle]);

  const handleSubmit = async (data: ArticleFormData) => {
    try {
      await updateArticle(articleId, data);
      router.push("/dashboard/content/articles");
    } catch (error) {
      logger.error("Error updating article", error);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-5xl py-6 mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-5xl py-6 mx-auto text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container max-w-5xl py-6 mx-auto text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <p className="text-muted-foreground">The article you're trying to edit doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <AddArticleForm onSubmit={handleSubmit} initialData={article} isEditing={true} />;
}
