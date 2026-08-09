import type { Article, Event } from "@/types/dashboard.types";

export interface PersonalRecommendationsWidgetProps {
  recommendedArticles?: Article[];
  recommendedEvents?: Event[];
  onReadArticle?: (articleId: string) => void;
  onRegisterForEvent?: (eventId: string) => void;
  onViewAllRecommendations?: () => void;
}

export interface RecommendedArticleCardProps {
  article: Article;
  onReadArticle?: (articleId: string) => void;
}

export interface RecommendedEventCardProps {
  event: Event;
  onRegisterForEvent?: (eventId: string) => void;
}
