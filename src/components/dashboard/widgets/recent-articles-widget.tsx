"use client";

import * as React from "react";
import { WidgetContainer } from "../../ui/widget-container";
import { Card, CardContent } from "../../ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "../../ui/badge";
import { FileText, User, Calendar, MessageSquare, ExternalLink, Bookmark } from "lucide-react";
import { Article } from "@/types/dashboard.types";

interface RecentArticlesWidgetProps {
  articles?: Article[];
  onReadArticle?: (articleId: string) => void;
  onBookmarkArticle?: (articleId: string) => void;
  onViewAllArticles?: () => void;
}

// Mock articles data - in a real app, this would come from an API
const mockArticles: Article[] = [
  {
    id: "1",
    title: "Getting Started with React Hooks",
    excerpt:
      "Learn the fundamentals of React Hooks and how to use them effectively in your applications.",
    author: "Jane Smith",
    publishedAt: new Date("2023-10-01T10:30:00"),
    category: "Development",
    readTime: 5,
    isBookmarked: false,
    commentCount: 12,
    viewCount: 245,
  },
  {
    id: "2",
    title: "The Future of Web Development",
    excerpt:
      "Exploring emerging trends and technologies that will shape the future of web development.",
    author: "John Doe",
    publishedAt: new Date("2023-09-28T14:15:00"),
    category: "Technology",
    readTime: 8,
    isBookmarked: true,
    commentCount: 24,
    viewCount: 512,
  },
  {
    id: "3",
    title: "Building Accessible Web Applications",
    excerpt:
      "Best practices and techniques for creating web applications that are accessible to all users.",
    author: "Alex Johnson",
    publishedAt: new Date("2023-09-25T09:45:00"),
    category: "Accessibility",
    readTime: 7,
    isBookmarked: false,
    commentCount: 8,
    viewCount: 187,
  },
  {
    id: "4",
    title: "Introduction to TypeScript",
    excerpt:
      "A comprehensive guide to getting started with TypeScript and its benefits for JavaScript developers.",
    author: "Sarah Williams",
    publishedAt: new Date("2023-09-22T16:20:00"),
    category: "Development",
    readTime: 10,
    isBookmarked: true,
    commentCount: 15,
    viewCount: 321,
  },
];

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Development":
      return "bg-chart-1/20 text-chart-1";
    case "Technology":
      return "bg-chart-2/20 text-chart-2";
    case "Accessibility":
      return "bg-chart-3/20 text-chart-3";
    case "Design":
      return "bg-chart-4/20 text-chart-4";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export function RecentArticlesWidget({
  articles = mockArticles,
  onReadArticle,
  onBookmarkArticle,
  onViewAllArticles,
}: RecentArticlesWidgetProps) {
  return (
    <WidgetContainer
      type="recent-articles"
      title="Recent Articles"
      description={`${articles.length} latest article${articles.length !== 1 ? "s" : ""}`}
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {articles.length} articles
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewAllArticles} className="text-xs">
                View all articles
              </Button>
            </div>

            {/* Articles list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {articles.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
                  <p>No articles available</p>
                </div>
              ) : (
                articles.map((article) => (
                  <div key={article.id} className="p-4 rounded-lg border bg-card border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground/90 line-clamp-1">
                            {article.title}
                          </h3>
                          <Badge className={getCategoryColor(article.category)}>
                            {article.category}
                          </Badge>
                        </div>

                        <p className="text-sm text-foreground/60 mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBookmarkArticle?.(article.id)}
                        className={`h-8 w-8 p-0 ml-2 ${
                          article.isBookmarked ? "text-chart-4" : "text-foreground/40"
                        }`}
                      >
                        <Bookmark
                          className="h-4 w-4"
                          fill={article.isBookmarked ? "currentColor" : "none"}
                        />
                      </Button>
                    </div>

                    {/* Article metadata */}
                    <div className="flex items-center justify-between text-xs text-foreground/50 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{article.author}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{article.readTime} min read</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{article.commentCount}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{article.viewCount} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Article actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReadArticle?.(article.id)}
                          className="text-xs"
                        >
                          Read Article
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReadArticle?.(article.id)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
