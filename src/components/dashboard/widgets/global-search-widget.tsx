"use client"

import * as React from "react"
import { WidgetContainer } from "../../ui/widget-container"
import { Card, CardContent } from "../../ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "../../ui/badge"
import { Search, FileText, Users, Calendar, MessageSquare, ExternalLink, TrendingUp } from "lucide-react"

interface GlobalSearchWidgetProps {
  onSearch?: (query: string) => void
  onAdvancedSearch?: () => void
}

// Mock search results data - in a real app, this would come from an API
const mockSearchResults = [
  {
    id: "1",
    type: "article",
    title: "Getting Started with React Hooks",
    description: "Learn the fundamentals of React Hooks and how to use them effectively in your applications.",
    author: "Jane Smith",
    date: new Date("2023-10-01T10:30:00"),
  },
  {
    id: "2",
    type: "event",
    title: "Web Development Workshop",
    description: "Join us for a hands-on workshop covering the latest web development techniques.",
    author: "John Doe",
    date: new Date("2023-10-15T09:00:00"),
  },
  {
    id: "3",
    type: "user",
    title: "Alex Johnson",
    description: "Senior Frontend Developer with expertise in React and TypeScript.",
    author: "Community Member",
    date: new Date("2023-09-20T14:15:00"),
  },
  {
    id: "4",
    type: "discussion",
    title: "Best practices for responsive web design",
    description: "Discussion about the latest techniques and approaches for creating responsive web designs.",
    author: "Sarah Williams",
    date: new Date("2023-09-28T16:20:00"),
  },
]

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const getItemTypeIcon = (type: string) => {
  switch (type) {
    case "article":
      return <FileText className="h-4 w-4 text-chart-1" />
    case "event":
      return <Calendar className="h-4 w-4 text-chart-3" />
    case "user":
      return <Users className="h-4 w-4 text-chart-2" />
    case "discussion":
      return <MessageSquare className="h-4 w-4 text-chart-4" />
    default:
      return <Search className="h-4 w-4 text-foreground/50" />
  }
}

const getItemTypeColor = (type: string) => {
  switch (type) {
    case "article":
      return "bg-chart-1/20 text-chart-1"
    case "event":
      return "bg-chart-3/20 text-chart-3"
    case "user":
      return "bg-chart-2/20 text-chart-2"
    case "discussion":
      return "bg-chart-4/20 text-chart-4"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

const getItemTypeLabel = (type: string) => {
  switch (type) {
    case "article":
      return "Article"
    case "event":
      return "Event"
    case "user":
      return "User"
    case "discussion":
      return "Discussion"
    default:
      return "Result"
  }
}

export function GlobalSearchWidget({
  onSearch,
  onAdvancedSearch,
}: GlobalSearchWidgetProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState(mockSearchResults)
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
    // In a real app, this would trigger an API call
    // For now, we'll just filter the mock results
    if (searchQuery.trim() === "") {
      setSearchResults(mockSearchResults)
    } else {
      const filteredResults = mockSearchResults.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(filteredResults)
    }
  }
  
  return (
    <WidgetContainer
      type="global-search"
      title="Global Search"
      description="Search across all content and resources"
      size="large"
    >
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="space-y-4">
            {/* Search form */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, events, users, discussions..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {searchResults.length} results
                  </Badge>
                  
                  {searchQuery && (
                    <Badge className="bg-chart-1/20 text-chart-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAdvancedSearch}
                  className="text-xs"
                >
                  Advanced Search
                </Button>
              </div>
            </form>
            
            {/* Search results */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <Search className="h-8 w-8 mx-auto mb-2 text-foreground/40" />
                  <p>No results found</p>
                  <p className="text-sm mt-2">Try different keywords or check your spelling.</p>
                </div>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 rounded-lg border bg-card border-border hover:bg-background transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getItemTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground/90 line-clamp-1">
                            {result.title}
                          </h3>
                          <Badge className={getItemTypeColor(result.type)}>
                            {getItemTypeLabel(result.type)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-foreground/60 mb-2 line-clamp-2">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-foreground/50">
                          <div className="flex items-center space-x-1">
                            <span>By {result.author}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span>{formatDate(result.date)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Popular searches */}
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-foreground/50 mb-2">Popular searches:</div>
              <div className="flex flex-wrap gap-2">
                {["React Hooks", "Web Development", "TypeScript", "Responsive Design"].map((term) => (
                  <Button
                    key={term}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery(term)}
                    className="text-xs h-7 px-2"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </WidgetContainer>
  )
}