"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Edit, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeader } from "@/contexts/dashboard-context";
import { useArticles } from "@/lib/hooks/use-articles";
import { Article } from "@/types/article";
import { ArticleActionsCard } from "./_components/article-actions-card";
import { ArticleContentCard } from "./_components/article-content-card";
import { ArticleHeaderCard } from "./_components/article-header-card";
import { ArticleMetricsCard } from "./_components/article-metrics-card";
import { ArticleTagsCard } from "./_components/article-tags-card";
import {
  ArticleErrorState,
  ArticleLoadingState,
  ArticleNotFoundState,
} from "./_components/page-states";

export default function ArticleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { getArticle } = useArticles();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = params.id as string;

  useEffect(() => {
    setHeader({
      title: "Article Details",
      description: "View detailed information about this article",
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
          setArticle(foundArticle);
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

  const handleEdit = () => {
    router.push(`/dashboard/content/articles/edit/${articleId}`);
  };

  const handleShare = () => {
    if (article) {
      navigator.clipboard.writeText(window.location.origin + `/articles/${article.slug}`);
      // You could show a toast notification here
    }
  };

  if (loading) {
    return <ArticleLoadingState />;
  }

  if (error) {
    return <ArticleErrorState error={error} onBack={() => router.back()} />;
  }

  if (!article) {
    return <ArticleNotFoundState onBack={() => router.back()} />;
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="pl-0 text-muted-foreground hover:text-primary"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Articles
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {article.status === "published" && article.visibility === "public" && (
            <Button
              variant="outline"
              onClick={() => window.open(`/news/${article.id}`, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View public page
            </Button>
          )}
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Article Header */}
      <ArticleHeaderCard article={article} />

      {/* Content Preview */}
      <ArticleContentCard content={article.content} />

      {/* Metrics */}
      <ArticleMetricsCard metrics={article.metrics} />

      {/* Tags */}
      <ArticleTagsCard tags={article.tags} />

      {/* Actions */}
      <ArticleActionsCard downloadEnabled={article.downloadEnabled} onShare={handleShare} />
    </div>
  );
}
