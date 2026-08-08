import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Publication } from "@/types/publication";

interface PublicationContentSectionProps {
  publication: Publication;
}

export function PublicationContentSection({ publication }: PublicationContentSectionProps) {
  return (
    <>
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
                  alt={`Gallery item ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(image, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
