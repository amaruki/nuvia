"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
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
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    case "discussion":
      return <MessageSquare className="h-4 w-4 text-purple-500" />
    case "event":
      return <Calendar className="h-4 w-4 text-green-500" />
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />
  }
}

const getActivityTypeColor = (type: string) => {
  switch (type) {
    case "forum-post":
      return "bg-blue-100 text-blue-800"
    case "discussion":
      return "bg-purple-100 text-purple-800"
    case "event":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
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
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
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
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No community activity</p>
                  <p className="text-sm mt-2">Recent forum posts, discussions, and events will be displayed here.</p>
                </div>
              ) : (
                sortedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg border bg-white border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {activity.title}
                          </h3>
                          <Badge className={getActivityTypeColor(activity.type)}>
                            {getActivityTypeLabel(activity.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <span>By {activity.author}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(activity.createdAt)}</span>
                        </div>
                        
                        {/* Engagement metrics */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
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
              <div className="text-xs text-gray-500 text-center pt-2">
                Join the conversation by participating in discussions and events
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}