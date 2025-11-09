"use client"

import * as React from "react"
import { WidgetContainer } from "../../ui/widget-container"
import { Card, CardContent } from "../../ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "../../ui/badge"
import { MessageSquare, Users, Heart, Share2, Calendar, TrendingUp, ExternalLink } from "lucide-react"
import { CommunityActivity } from "@/types/dashboard.types"

interface CommunityActivityWidgetProps {
  activities?: CommunityActivity[]
  onViewActivity?: (activityId: string) => void
  onViewAllActivities?: () => void
}

// Mock community activities data - in a real app, this would come from an API
const mockActivities: CommunityActivity[] = [
  {
    id: "1",
    type: "forum-post",
    title: "Best practices for responsive web design",
    author: "Jane Smith",
    createdAt: new Date("2023-10-01T10:30:00"),
    engagement: {
      likes: 24,
      comments: 12,
      shares: 5,
    },
  },
  {
    id: "2",
    type: "discussion",
    title: "What's your favorite JavaScript framework?",
    author: "John Doe",
    createdAt: new Date("2023-09-30T14:15:00"),
    engagement: {
      likes: 42,
      comments: 28,
      shares: 8,
    },
  },
  {
    id: "3",
    type: "event",
    title: "Upcoming Web Development Workshop",
    author: "Alex Johnson",
    createdAt: new Date("2023-09-29T09:45:00"),
    engagement: {
      likes: 56,
      comments: 15,
      shares: 12,
    },
  },
  {
    id: "4",
    type: "forum-post",
    title: "Introduction to TypeScript for beginners",
    author: "Sarah Williams",
    createdAt: new Date("2023-09-28T16:20:00"),
    engagement: {
      likes: 38,
      comments: 21,
      shares: 7,
    },
  },
]

const formatDate = (date: Date) => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return "Just now"
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "forum-post":
      return <MessageSquare className="h-4 w-4 text-chart-1" />
    case "discussion":
      return <MessageSquare className="h-4 w-4 text-chart-2" />
    case "event":
      return <Calendar className="h-4 w-4 text-chart-3" />
    default:
      return <MessageSquare className="h-4 w-4 text-foreground/50" />
  }
}

const getActivityTypeColor = (type: string) => {
  switch (type) {
    case "forum-post":
      return "bg-chart-1/20 text-chart-1"
    case "discussion":
      return "bg-chart-2/20 text-chart-2"
    case "event":
      return "bg-chart-3/20 text-chart-3"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

const getActivityTypeLabel = (type: string) => {
  switch (type) {
    case "forum-post":
      return "Forum Post"
    case "discussion":
      return "Discussion"
    case "event":
      return "Event"
    default:
      return "Activity"
  }
}

export function CommunityActivityWidget({
  activities = mockActivities,
  onViewActivity,
  onViewAllActivities,
}: CommunityActivityWidgetProps) {
  // Sort activities by creation date (newest first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  return (
    <WidgetContainer
      type="community-activity"
      title="Community Activity"
      description={`${activities.length} recent activit${activities.length !== 1 ? 'ies' : 'y'}`}
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {activities.length} activities
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllActivities}
                className="text-xs"
              >
                View all
              </Button>
            </div>
            
            {/* Activities list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
                  <p>No community activity</p>
                  <p className="text-sm mt-2">Recent forum posts, discussions, and events will be displayed here.</p>
                </div>
              ) : (
                sortedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg border bg-card border-border"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground/90 line-clamp-1">
                            {activity.title}
                          </h3>
                          <Badge className={getActivityTypeColor(activity.type)}>
                            {getActivityTypeLabel(activity.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-xs text-foreground/50 mb-3">
                          <span>By {activity.author}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(activity.createdAt)}</span>
                        </div>
                        
                        {/* Engagement metrics */}
                        <div className="flex items-center space-x-4 text-xs text-foreground/50">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{activity.engagement.likes}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{activity.engagement.comments}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Share2 className="h-3 w-3" />
                            <span>{activity.engagement.shares}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {activity.engagement.likes + activity.engagement.comments + activity.engagement.shares} total
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2"
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          Like
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Comment
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-2"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewActivity?.(activity.id)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Empty state hint */}
            {activities.length > 0 && (
              <div className="text-xs text-foreground/50 text-center pt-2">
                Join the conversation by participating in discussions and events
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}