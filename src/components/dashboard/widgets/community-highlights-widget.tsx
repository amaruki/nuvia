"use client"

import * as React from "react"
import { WidgetContainer } from "../../ui/widget-container"
import { Card, CardContent } from "../../ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "../../ui/badge"
import { 
  Users, 
  Calendar, 
  Trophy, 
  Star, 
  MessageSquare, 
  TrendingUp, 
  ExternalLink,
  Award,
  UserPlus
} from "lucide-react"

interface CommunityHighlightsWidgetProps {
  onViewAllHighlights?: () => void
}

// Mock community highlights data - in a real app, this would come from an API
const communityHighlights = [
  {
    id: "1",
    type: "member",
    title: "Member of the Month",
    description: "Jane Smith has been recognized for her outstanding contributions to the community.",
    memberName: "Jane Smith",
    date: new Date("2023-10-01T10:30:00"),
    icon: <Trophy className="h-5 w-5 text-chart-4" />,
    badge: "New",
  },
  {
    id: "2",
    type: "event",
    title: "Upcoming Community Event",
    description: "Join us for our annual community meetup on October 15th.",
    eventName: "Annual Community Meetup",
    date: new Date("2023-10-15T09:00:00"),
    icon: <Calendar className="h-5 w-5 text-chart-3" />,
    badge: null,
  },
  {
    id: "3",
    type: "discussion",
    title: "Trending Discussion",
    description: "The future of web development is being discussed by our community members.",
    discussionTitle: "The Future of Web Development",
    commentCount: 42,
    date: new Date("2023-09-28T16:20:00"),
    icon: <MessageSquare className="h-5 w-5 text-chart-2" />,
    badge: "Hot",
  },
  {
    id: "4",
    type: "milestone",
    title: "Community Milestone",
    description: "Our community has reached 1000 members! Thank you for being part of this journey.",
    milestone: "1000 Members",
    date: new Date("2023-09-25T14:15:00"),
    icon: <Award className="h-5 w-5 text-chart-1" />,
    badge: null,
  },
]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function CommunityHighlightsWidget({
  onViewAllHighlights,
}: CommunityHighlightsWidgetProps) {
  return (
    <WidgetContainer
      type="community-highlights"
      title="Community Highlights"
      description="Notable activities and achievements"
      size="medium"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-foreground/50" />
                <span className="text-sm font-medium text-foreground/70">
                  {communityHighlights.length} highlights
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllHighlights}
                className="text-xs"
              >
                View all
              </Button>
            </div>
            
            {/* Highlights list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {communityHighlights.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <Star className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
                  <p>No community highlights</p>
                  <p className="text-sm mt-2">Community achievements and notable activities will be displayed here.</p>
                </div>
              ) : (
                communityHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="p-4 rounded-lg border bg-card border-border"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {highlight.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground/90 line-clamp-1">
                            {highlight.title}
                          </h3>
                          {highlight.badge && (
                            <Badge className={
                              highlight.badge === "New"
                                ? "bg-chart-1/20 text-chart-1"
                                : highlight.badge === "Hot"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-secondary text-secondary-foreground"
                            }>
                              {highlight.badge}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-foreground/60 mb-2 line-clamp-2">
                          {highlight.description}
                        </p>
                        
                        {/* Highlight-specific details */}
                        <div className="text-xs text-foreground/50 mb-2">
                          {highlight.type === "member" && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>Member: {highlight.memberName}</span>
                            </div>
                          )}
                          
                          {highlight.type === "event" && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Event: {highlight.eventName}</span>
                            </div>
                          )}
                          
                          {highlight.type === "discussion" && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Discussion: {highlight.discussionTitle}</span>
                              <span>•</span>
                              <span>{highlight.commentCount} comments</span>
                            </div>
                          )}
                          
                          {highlight.type === "milestone" && (
                            <div className="flex items-center space-x-1">
                              <Trophy className="h-3 w-3" />
                              <span>Milestone: {highlight.milestone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1 mt-1">
                            <span>{formatDate(highlight.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Highlight actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        {highlight.type === "member" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                        )}
                        
                        {highlight.type === "event" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Register
                          </Button>
                        )}
                        
                        {highlight.type === "discussion" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Join Discussion
                          </Button>
                        )}
                        
                        {highlight.type === "milestone" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Invite Friends
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Community growth indicator */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-foreground/50 mb-2">
                <span>Community Growth</span>
                <span className="text-chart-3 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% this month
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-chart-3 h-2 rounded-full"
                  style={{ width: "78%" }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}