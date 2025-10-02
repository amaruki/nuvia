"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { Sparkles, User, Calendar, Clock, ExternalLink, Bookmark, FileText } from "lucide-react"
import { Article, Event } from "@/types/dashboard.types"

interface PersonalRecommendationsWidgetProps {
  recommendedArticles?: Article[]
  recommendedEvents?: Event[]
  onReadArticle?: (articleId: string) => void
  onRegisterForEvent?: (eventId: string) => void
  onViewAllRecommendations?: () => void
}

// Mock recommended articles data - in a real app, this would come from an API
const mockRecommendedArticles: Article[] = [
  {
    id: "1",
    title: "Advanced React Patterns",
    excerpt: "Learn advanced React patterns and techniques to build scalable applications.",
    author: "Jane Smith",
    publishedAt: new Date("2023-09-28T10:30:00"),
    category: "Development",
    readTime: 8,
    isBookmarked: false,
  },
  {
    id: "2",
    title: "CSS Grid Layout Masterclass",
    excerpt: "Master CSS Grid Layout with practical examples and use cases.",
    author: "John Doe",
    publishedAt: new Date("2023-09-25T14:15:00"),
    category: "Design",
    readTime: 6,
    isBookmarked: true,
  },
]

// Mock recommended events data - in a real app, this would come from an API
const mockRecommendedEvents: Event[] = [
  {
    id: "1",
    title: "JavaScript Frameworks Comparison",
    description: "A comprehensive comparison of popular JavaScript frameworks.",
    startDate: new Date("2023-10-10T10:00:00"),
    endDate: new Date("2023-10-10T12:00:00"),
    location: "Online (Zoom)",
    isRegistered: false,
    isCheckedIn: false,
  },
  {
    id: "2",
    title: "UI/UX Design Workshop",
    description: "Learn the fundamentals of UI/UX design in this hands-on workshop.",
    startDate: new Date("2023-10-15T09:00:00"),
    endDate: new Date("2023-10-15T13:00:00"),
    location: "Design Studio",
    isRegistered: true,
    isCheckedIn: false,
  },
]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Development":
      return "bg-blue-100 text-blue-800"
    case "Design":
      return "bg-pink-100 text-pink-800"
    case "Technology":
      return "bg-purple-100 text-purple-800"
    case "Accessibility":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

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
                <Sparkles className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
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
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No recommendations available</p>
                  <p className="text-sm mt-2">Recommendations based on your interests will be displayed here.</p>
                </div>
              ) : (
                <>
                  {/* Recommended Articles Section */}
                  {recommendedArticles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Recommended Articles
                      </h4>
                      
                      {recommendedArticles.map((article) => (
                        <div
                          key={`article-${article.id}`}
                          className="p-3 rounded-lg border bg-white border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                  {article.title}
                                </h5>
                                <Badge className={getCategoryColor(article.category)}>
                                  {article.category}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {article.excerpt}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ml-2 ${
                                article.isBookmarked ? "text-yellow-500" : "text-gray-400"
                              }`}
                            >
                              <Bookmark
                                className="h-4 w-4"
                                fill={article.isBookmarked ? "currentColor" : "none"}
                              />
                            </Button>
                          </div>
                          
                          {/* Article metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
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
                                <Clock className="h-3 w-3" />
                                <span>{article.readTime} min read</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Article actions */}
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReadArticle?.(article.id)}
                              className="text-xs"
                            >
                              Read Article
                            </Button>
                            
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
                      ))}
                    </div>
                  )}
                  
                  {/* Recommended Events Section */}
                  {recommendedEvents.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Recommended Events
                      </h4>
                      
                      {recommendedEvents.map((event) => (
                        <div
                          key={`event-${event.id}`}
                          className="p-3 rounded-lg border bg-white border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {event.title}
                              </h5>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {event.description}
                              </p>
                            </div>
                          </div>
                          
                          {/* Event metadata */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-2" />
                              <span>{formatDate(new Date(event.startDate))}</span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-2" />
                              <span>
                                {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="inline-block w-3 h-3 mr-2 rounded-full bg-gray-400"></span>
                              <span>{event.location}</span>
                            </div>
                          </div>
                          
                          {/* Event actions */}
                          <div className="flex items-center justify-between">
                            {event.isRegistered ? (
                              <Badge className="bg-green-100 text-green-800">
                                Registered
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRegisterForEvent?.(event.id)}
                                className="text-xs"
                              >
                                Register Now
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRegisterForEvent?.(event.id)}
                              className="text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Empty state hint */}
            {recommendedArticles.length > 0 || recommendedEvents.length > 0 ? (
              <div className="text-xs text-gray-500 text-center pt-2">
                Recommendations are based on your interests and activity
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}