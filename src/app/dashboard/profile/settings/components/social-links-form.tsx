"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/hooks/use-session";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import {
  Link, Plus, X, CheckCircle, AlertCircle, ExternalLink,
  Github, Linkedin, Twitter, Globe, Instagram, Youtube,
  Facebook, Loader2, Save
} from "lucide-react";

import { updateProfile } from "@/lib/utils/auth-client-utils";

// Social link validation schema
const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Please enter a valid URL"),
  label: z.string().optional()
});

const socialLinksFormSchema = z.object({
  links: z.array(socialLinkSchema).optional()
});

interface SocialLinksFormProps {
  user: any;
}

// Predefined social platforms with validation patterns
const socialPlatforms = {
  twitter: {
    name: "Twitter",
    icon: Twitter,
    baseUrl: "https://twitter.com/",
    pattern: /^https?:\/\/(www\.)?twitter\.com\/.+/,
    color: "text-[#1DA1F2]"
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    baseUrl: "https://linkedin.com/in/",
    pattern: /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/,
    color: "text-[#0077B5]"
  },
  github: {
    name: "GitHub",
    icon: Github,
    baseUrl: "https://github.com/",
    pattern: /^https?:\/\/(www\.)?github\.com\/.+/,
    color: "text-[#333333]"
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    baseUrl: "https://instagram.com/",
    pattern: /^https?:\/\/(www\.)?instagram\.com\/.+/,
    color: "text-[#E4405F]"
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    baseUrl: "https://youtube.com/",
    pattern: /^https?:\/\/(www\.)?youtube\.com\/.+/,
    color: "text-[#FF0000]"
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    baseUrl: "https://facebook.com/",
    pattern: /^https?:\/\/(www\.)?facebook\.com\/.+/,
    color: "text-[#1877F2]"
  },
  website: {
    name: "Website",
    icon: Globe,
    baseUrl: "https://",
    pattern: /^https?:\/\/.+/,
    color: "text-blue-600"
  }
} as const;

type SocialPlatform = keyof typeof socialPlatforms;

interface SocialLink {
  id?: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
}

export function SocialLinksForm({ user }: SocialLinksFormProps) {
  const { update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Parse existing social links
  const existingLinks: SocialLink[] = user.externalLinks
    ? Object.entries(user.externalLinks as Record<string, any>).map(([key, value]) => ({
        id: key,
        platform: key as SocialPlatform,
        url: typeof value === 'string' ? value : value.url,
        label: typeof value === 'string' ? undefined : value.label
      }))
    : [];

  const [links, setLinks] = useState<SocialLink[]>(existingLinks);
  const [newLink, setNewLink] = useState<Partial<SocialLink>>({
    platform: 'github',
    url: '',
    label: ''
  });

  const linksForm = useForm({
    resolver: zodResolver(socialLinksFormSchema),
    defaultValues: {
      links: existingLinks
    }
  });

  const socialLinksMutation = useMutation({
    mutationFn: async (updatedLinks: SocialLink[]) => {
      // Convert links array back to the format expected by the database
      const linksObject: Record<string, any> = {};
      updatedLinks.forEach(link => {
        linksObject[link.platform] = link.label
          ? { url: link.url, label: link.label }
          : link.url;
      });

      const result = await updateProfile({
        externalLinks: linksObject
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to update social links");
      }

      return result;
    },
    onSuccess: async (result) => {
      setIsSuccess(true);

      // Update session data
      await updateSession({
        user: {
          ...user,
          externalLinks: result.data.externalLinks
        }
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error: any) => {
      console.error("Failed to update social links:", error);
    }
  });

  const validateSocialUrl = (platform: SocialPlatform, url: string): boolean => {
    const platformConfig = socialPlatforms[platform];
    return platformConfig.pattern.test(url);
  };

  const addLink = () => {
    if (!newLink.url || !newLink.platform) {
      return;
    }

    const url = newLink.url.startsWith('http')
      ? newLink.url
      : `https://${newLink.url}`;

    if (!validateSocialUrl(newLink.platform, url)) {
      // You could show an error message here
      return;
    }

    const linkToAdd: SocialLink = {
      id: Date.now().toString(),
      platform: newLink.platform,
      url,
      label: newLink.label
    };

    setLinks([...links, linkToAdd]);
    setNewLink({ platform: 'github', url: '', label: '' });
    setIsAddingLink(false);
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const saveLinks = () => {
    socialLinksMutation.mutate(links);
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    const Icon = socialPlatforms[platform].icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Social links updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* OAuth Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Connected OAuth Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(socialPlatforms)
              .filter(([key]) => ['twitter', 'github', 'linkedin'].includes(key))
              .map(([key, platform]) => {
                const Icon = platform.icon;
                const isConnected = user.accounts?.some((account: any) =>
                  account.provider.toLowerCase() === key
                );

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${platform.color}`} />
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {isConnected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={isConnected} disabled />
                      <Badge variant={isConnected ? "default" : "secondary"}>
                        {isConnected ? 'Connected' : 'Connect'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="text-xs text-muted-foreground">
            OAuth account management will be available in a future update.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Custom Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Links */}
          {links.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Your Links</h4>
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className={`flex items-center gap-2 ${socialPlatforms[link.platform].color}`}>
                    {getPlatformIcon(link.platform)}
                    <span className="font-medium text-sm">
                      {socialPlatforms[link.platform].name}
                    </span>
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
                    {link.label && (
                      <p className="text-xs text-muted-foreground">{link.label}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(link.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Link */}
          {isAddingLink ? (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium">Add New Link</h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    value={newLink.platform}
                    onChange={(e) => setNewLink({
                      ...newLink,
                      platform: e.target.value as SocialPlatform
                    })}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    {Object.entries(socialPlatforms).map(([key, platform]) => (
                      <option key={key} value={key}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Custom Label (Optional)</Label>
                  <Input
                    id="label"
                    placeholder="My Portfolio"
                    value={newLink.label || ''}
                    onChange={(e) => setNewLink({
                      ...newLink,
                      label: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder={socialPlatforms[newLink.platform as SocialPlatform]?.baseUrl}
                  value={newLink.url || ''}
                  onChange={(e) => setNewLink({
                    ...newLink,
                    url: e.target.value
                  })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={addLink} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingLink(false);
                    setNewLink({ platform: 'github', url: '', label: '' });
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAddingLink(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          )}

          {/* Save Button */}
          {links.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={saveLinks}
                disabled={socialLinksMutation.isPending}
                className="min-w-32"
              >
                {socialLinksMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Links
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-2">About Social Links:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Add your social media profiles and personal websites</li>
            <li>• Links will be displayed on your public profile</li>
            <li>• You can add custom labels to describe your links</li>
            <li>• OAuth connections provide seamless authentication</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}