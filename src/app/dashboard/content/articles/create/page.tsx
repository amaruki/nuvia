"use client";

import { useRouter } from "next/navigation";
import { useHeader } from "@/contexts/dashboard-context";
import { useArticles } from "@/lib/hooks/use-articles";
import { logger } from "@/lib/logger";
import AddArticleForm from "@/components/content/add-article-form";
import { ArticleFormData } from "@/types/article";
import { useEffect } from "react";

export default function CreateArticlePage() {
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const { addArticle } = useArticles();

  useEffect(() => {
    setHeader({
      title: "Create New Article",
      description: "Write and publish a new article for the community",
    });

    return () => {
      clearHeader();
    };
  }, [setHeader, clearHeader]);

  const handleSubmit = async (data: ArticleFormData) => {
    try {
      await addArticle(data);
      router.push("/dashboard/content/articles");
    } catch (error) {
      logger.error("Error creating article", error);
    }
  };

  return <AddArticleForm onSubmit={handleSubmit} isEditing={false} />;
}
