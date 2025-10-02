"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { FileText, MessageSquare, Calendar, User, Eye, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { Article } from "@/types/dashboard.types"

interface RecentContentWidgetProps {
  articles?: Article[]
  onEditContent?: (contentId: string) => void
  onViewContent?: (contentId: string) => void
  onViewAllContent?: () => void
}

// Mock recent content data - in a real app, this would come from an API
const mockArticles: Article[] = [
  {
    id: "1",
    title: "Getting Started with React Hooks",
    excerpt: "Learn the fundamentals of React Hooks and how to use them effectively in your applications.",
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
    excerpt: "Exploring emerging trends and technologies that will shape the future of web development.",
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
    excerpt: "Best practices and techniques for creating web applications that are accessible to all users.",
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
    excerpt: "A comprehensive guide to getting started with TypeScript and its benefits for JavaScript developers.",
    author: "Sarah Williams",
    publishedAt: new Date("2023-09-22T16:20:00"),
    category: "Development",
    readTime: 10,
    isBookmarked: true,
    commentCount: 15,
    viewCount: 321,
  },
]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Development":
      return "bg-blue-100 text-blue-800"
    case "Technology":
      return "bg-purple-100 text-purple-800"
    case "Accessibility":
      return "bg-green-100 text-green-800"
    case "Design":
      return "bg-pink-100 text-pink-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function RecentContentWidget({
  articles = mockArticles,
  onEditContent,
  onViewContent,
  onViewAllContent,
}: RecentContentWidgetProps) {
  // Sort articles by publish date (newest first)
  const sortedArticles = [...articles].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  
  return (
    <WidgetContainer
      type="recent-content"
      title="Recent Content"
      description={`${articles.length} latest content item${articles.length !== 1 ? 's' : ''}`}
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {articles.length} articles
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAllContent}
                  className="text-xs"
                >
                  View all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Create New
                </Button>
              </div>
            </div>
            
            {/* Content list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {articles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No content available</p>
                  <p className="text-sm mt-2">Create new content or manage existing articles.</p>
                </div>
              ) : (
                sortedArticles.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 rounded-lg border bg-white border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {article.title}
                          </h3>
                          <Badge className={getCategoryColor(article.category)}>
                            {article.category}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>
                    
                    {/* Content metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
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
                          <span>{article.commentCount || 0}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content performance */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-gray-500">
                        Performance:
                      </div>
                      <div className="flex items-center text-xs">
                        {(article.viewCount || 0) > 300 ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            <span className="text-green-600">High engagement</span>
                          </>
                        ) : (article.viewCount || 0) > 150 ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1 text-yellow-500" />
                            <span className="text-yellow-600">Moderate engagement</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                            <span className="text-red-600">Low engagement</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Content actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditContent?.(article.id)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewContent?.(article.id)}
                          className="text-xs"
                        >
                          View
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Publish
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Content data updated in real-time. Last updated: Today at 9:15 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}