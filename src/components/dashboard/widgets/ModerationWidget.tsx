"use client"

import * as React from "react"
import { WidgetContainer } from "../ui/WidgetContainer"
import { Card, CardContent } from "../ui/Card"
import { Button } from "@/components/ui/button"
import { Badge } from "../ui/Badge"
import { Flag, MessageSquare, User, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { ModerationItem } from "@/types/dashboard.types"

interface ModerationWidgetProps {
  moderationItems?: ModerationItem[]
  onApproveItem?: (itemId: string) => void
  onRejectItem?: (itemId: string) => void
  onViewItem?: (itemId: string) => void
  onViewAllItems?: () => void
}

// Mock moderation items data - in a real app, this would come from an API
const mockModerationItems: ModerationItem[] = [
  {
    id: "1",
    type: "comment",
    content: "This comment contains inappropriate language and violates our community guidelines.",
    reportedBy: "Jane Smith",
    reportReason: "Inappropriate language",
    createdAt: new Date("2023-10-01T10:30:00"),
    status: "pending",
  },
  {
    id: "2",
    type: "forum-thread",
    content: "This forum thread contains spam links and promotional content unrelated to the discussion.",
    reportedBy: "John Doe",
    reportReason: "Spam content",
    createdAt: new Date("2023-09-30T14:15:00"),
    status: "pending",
  },
  {
    id: "3",
    type: "comment",
    content: "This comment includes personal attacks and harassment towards other community members.",
    reportedBy: "Alex Johnson",
    reportReason: "Harassment",
    createdAt: new Date("2023-09-29T09:45:00"),
    status: "reviewed",
  },
  {
    id: "4",
    type: "forum-thread",
    content: "This thread contains misinformation that could be harmful to our community.",
    reportedBy: "Sarah Williams",
    reportReason: "Misinformation",
    createdAt: new Date("2023-09-28T16:20:00"),
    status: "resolved",
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

const getItemTypeColor = (type: string) => {
  switch (type) {
    case "comment":
      return "bg-blue-100 text-blue-800"
    case "forum-thread":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "reviewed":
      return "bg-blue-100 text-blue-800"
    case "resolved":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getItemTypeIcon = (type: string) => {
  switch (type) {
    case "comment":
      return <MessageSquare className="h-4 w-4" />
    case "forum-thread":
      return <MessageSquare className="h-4 w-4" />
    default:
      return <Flag className="h-4 w-4" />
  }
}

export function ModerationWidget({
  moderationItems = mockModerationItems,
  onApproveItem,
  onRejectItem,
  onViewItem,
  onViewAllItems,
}: ModerationWidgetProps) {
  // Sort items by creation date (newest first) and filter to only show pending and reviewed items
  const sortedItems = [...moderationItems]
    .filter(item => item.status !== "resolved")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  const pendingItems = sortedItems.filter(item => item.status === "pending")
  const reviewedItems = sortedItems.filter(item => item.status === "reviewed")
  
  return (
    <WidgetContainer
      type="moderation"
      title="Content Moderation"
      description={`${pendingItems.length} pending item${pendingItems.length !== 1 ? 's' : ''} to review`}
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Header with action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flag className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {pendingItems.length} pending, {reviewedItems.length} reviewed
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAllItems}
                className="text-xs"
              >
                View all
              </Button>
            </div>
            
            {/* Moderation items list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sortedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No moderation items</p>
                  <p className="text-sm mt-2">Reported content will appear here for review.</p>
                </div>
              ) : (
                sortedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.status === "pending" 
                        ? "bg-yellow-50 border-yellow-200" 
                        : item.status === "reviewed"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start space-x-2">
                        <div className="mt-0.5">
                          {getItemTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {item.type === "comment" ? "Comment" : "Forum Thread"}
                            </h3>
                            <Badge className={getItemTypeColor(item.type)}>
                              {item.type === "comment" ? "Comment" : "Forum Thread"}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status === "pending" ? "Pending" : item.status === "reviewed" ? "Reviewed" : "Resolved"}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {item.content}
                          </p>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Reported by {item.reportedBy}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-3">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(item.createdAt)} at {formatTime(item.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-1">
                            Reason: {item.reportReason}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Moderation actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex space-x-2">
                        {item.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onApproveItem?.(item.id)}
                              className="text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRejectItem?.(item.id)}
                              className="text-xs"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {item.status === "reviewed" && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Under review
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewItem?.(item.id)}
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
            
            {/* Summary */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Moderation queue updated in real-time. Last updated: Today at 10:45 AM
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}