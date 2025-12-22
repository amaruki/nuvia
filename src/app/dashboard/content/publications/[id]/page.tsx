"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Share2,
  Download,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  User,
  Clock,
  Tag,
  FileText,
  BarChart3,
  Settings,
  Archive,
  Trash2,
  ExternalLink,
  Star,
  Pin,
} from "lucide-react";
import { usePublications } from "@/lib/hooks/use-publications";
import { useHeader } from "@/contexts/dashboard-context";
import { Publication } from "@/types/publication.types";
import { PUBLICATION_TYPE_DISPLAY, PUBLICATION_CATEGORY_DISPLAY, PUBLICATION_STATUS_DISPLAY } from "@/types/publication.types";

export default function PublicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeader, clearHeader } = useHeader();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { getPublication, updatePublication, deletePublication, publishPublication, archivePublication } = usePublications();

  // Query for publication data
  const { data: publication, isLoading, error: queryError } = useQuery({
    queryKey: ['publication', params.id],
    queryFn: async () => {
      // Get the publication ID from params
      const id = params.id as string;
      
      // Simulate API call - in real app this would be fetch('/api/publications/${id}')
      // For now, we'll use a simple timeout to simulate async behavior
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get publication from the hook (this is already available in the component)
      const pub = getPublication(id);
      if (!pub) {
        throw new Error("Publication not found");
      }
      return pub;
    },
    enabled: !!params.id,
  });

  // Update header when publication data is available
  useState(() => {
    if (publication) {
      setHeader({
        title: publication.title,
        description: `View and manage ${publication.type} publication details`,
      });
    }

    return () => {
      clearHeader();
    };
  });

  const handleEdit = () => {
    router.push(`/dashboard/content/publications/edit/${params.id}`);
  };

  const handleDelete = async () => {
    if (!publication) return;
    
    if (confirm(`Are you sure you want to delete "${publication.title}"? This action cannot be undone.`)) {
      try {
        await deletePublication(publication.id);
        router.push("/dashboard/content/publications");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete publication");
      }
    }
  };

  const handlePublish = async () => {
    if (!publication) return;
    
    try {
      await publishPublication(publication.id);
      // Invalidate and refetch query to get updated data
      queryClient.invalidateQueries({ queryKey: ['publication', params.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish publication");
    }
  };

  const handleArchive = async () => {
    if (!publication) return;
    
    try {
      await archivePublication(publication.id);
      // Invalidate and refetch query to get updated data
      queryClient.invalidateQueries({ queryKey: ['publication', params.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive publication");
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (queryError || !publication) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || queryError?.message || "Publication not found"}</p>
        </div>
      </div>
    );
  }

  const typeDisplay = PUBLICATION_TYPE_DISPLAY[publication.type];
  const categoryDisplay = PUBLICATION_CATEGORY_DISPLAY[publication.category];
  const statusDisplay = PUBLICATION_STATUS_DISPLAY[publication.status];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Publications
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          {publication.status === 'draft' && (
            <Button size="sm" onClick={handlePublish}>
              <FileText className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          
          {publication.status === 'published' && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Publication Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{publication.title}</h1>
            <p className="text-lg text-muted-foreground">{publication.excerpt}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusDisplay.badgeVariant} className="flex items-center gap-1">
              {statusDisplay.name}
            </Badge>
            {publication.isFeatured && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Featured
              </Badge>
            )}
            {publication.isPinned && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {publication.author.name}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(publication.lastModified)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {publication.readTime} min read
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {publication.wordCount} words
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {typeDisplay.name}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {categoryDisplay.name}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {publication.difficulty}
          </Badge>
          {publication.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Featured Image */}
      {publication.featuredImage && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Featured Image</h3>
          <img 
            src={publication.featuredImage} 
            alt={publication.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Content</h3>
        <div className="prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap">{publication.content}</div>
        </div>
      </div>

      {/* Gallery */}
      {publication.gallery && publication.gallery.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Gallery</h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {publication.gallery.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image} 
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(image, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(publication.metrics.views)}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(publication.metrics.likes)}</p>
                <p className="text-sm text-muted-foreground">Likes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-50">
                <MessageCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(publication.metrics.comments)}</p>
                <p className="text-sm text-muted-foreground">Comments</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50">
                <Bookmark className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(publication.metrics.bookmarks)}</p>
                <p className="text-sm text-muted-foreground">Bookmarks</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Engagement Score</span>
              <span className="text-lg font-bold">{publication.metrics.engagementScore}%</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Average Read Time</span>
              <span className="text-lg font-bold">{publication.metrics.averageReadTime} min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            SEO & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">SEO Title</h4>
              <p className="text-sm text-muted-foreground">{publication.seo.title}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Meta Description</h4>
              <p className="text-sm text-muted-foreground">{publication.seo.description}</p>
            </div>
          </div>
          
          {publication.seo.keywords && publication.seo.keywords.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {publication.seo.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Visibility</span>
              <Badge variant="outline">{publication.visibility.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Priority</span>
              <span className="font-medium">{publication.priority}</span>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${publication.commentsEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Comments {publication.commentsEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${publication.sharingEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Sharing {publication.sharingEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${publication.downloadEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Downloads {publication.downloadEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}