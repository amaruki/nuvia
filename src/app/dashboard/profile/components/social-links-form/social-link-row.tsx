import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";

import { socialPlatforms, type SocialLink } from "./platforms";

interface SocialLinkRowProps {
  link: SocialLink;
  onRemove: (id: string) => void;
}

export function SocialLinkRow({ link, onRemove }: SocialLinkRowProps) {
  const { color, icon: Icon, name } = socialPlatforms[link.platform];

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <div className="flex-1 min-w-0">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          {link.url}
        </a>
        {link.label && <p className="text-xs text-muted-foreground">{link.label}</p>}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(link.id!)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
