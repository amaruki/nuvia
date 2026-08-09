"use client";

import * as React from "react";
import { WidgetContainer } from "@/components/ui/widget-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, FileText } from "lucide-react";
import { mockRecommendedArticles, mockRecommendedEvents } from "./mock-data";
import { RecommendedArticleCard } from "./article-card";
import { RecommendedEventCard } from "./event-card";
import type { PersonalRecommendationsWidgetProps } from "./types";

export function PersonalRecommendationsWidget({
  recommendedArticles = mockRecommendedArticles,
  recommendedEvents = mockRecommendedEvents,
  onReadArticle,
  onRegisterForEvent,
  onViewAllRecommendations,
}: PersonalRecommendationsWidgetProps) {
  return (
    <WidgetContainer
      type="personal-recommendations"
      title="Personal Recommendations"
      description="Content and events tailored for you"
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {recommendedArticles.length + recommendedEvents.length} recommendations
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllRecommendations}
                className="text-xs"
              >
                View all
              </Button>
            </div>

            {/* Recommendations list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recommendedArticles.length === 0 && recommendedEvents.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
                  <p>No recommendations available</p>
                  <p className="text-sm mt-2">
                    Recommendations based on your interests will be displayed here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Recommended Articles Section */}
                  {recommendedArticles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground/70 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Recommended Articles
                      </h4>

                      {recommendedArticles.map((article) => (
                        <RecommendedArticleCard
                          key={`article-${article.id}`}
                          article={article}
                          onReadArticle={onReadArticle}
                        />
                      ))}
                    </div>
                  )}

                  {/* Recommended Events Section */}
                  {recommendedEvents.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-foreground/70 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Recommended Events
                      </h4>

                      {recommendedEvents.map((event) => (
                        <RecommendedEventCard
                          key={`event-${event.id}`}
                          event={event}
                          onRegisterForEvent={onRegisterForEvent}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Empty state hint */}
            {recommendedArticles.length > 0 || recommendedEvents.length > 0 ? (
              <div className="text-xs text-foreground/50 text-center pt-2">
                Recommendations are based on your interests and activity
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  );
}
