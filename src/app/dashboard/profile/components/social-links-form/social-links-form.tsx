"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/hooks/use-session";
import { logger } from "@/lib/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { CheckCircle, Globe, Loader2, Plus, Save } from "lucide-react";

import { updateProfileAction } from "@/lib/actions/auth.actions";

import { AddLinkForm } from "./add-link-form";
import { ConnectedAccountsCard } from "./connected-accounts-card";
import { HelpCard } from "./help-card";
import {
  parseExternalLinks,
  type OAuthAccount,
  type SocialLink,
  type StoredLinkValue,
} from "./platforms";
import { SocialLinkRow } from "./social-link-row";
import { socialLinksFormSchema, validateSocialUrl } from "./validation";

// The profile page passes the session user; external links and OAuth accounts
// are only present once the auth provider has synced them.
type SocialLinksFormUser = {
  // Session users always carry an id; the link fields below are only present
  // once the auth provider has synced them.
  id: string;
  externalLinks?: Record<string, StoredLinkValue>;
  accounts?: OAuthAccount[];
};

interface SocialLinksFormProps {
  user: SocialLinksFormUser;
}

export function SocialLinksForm({ user }: SocialLinksFormProps) {
  // Session and form instances are retained for parity with the profile page's
  // other forms; this view drives its own row state below.
  const _session = useSession();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Parse existing social links
  const existingLinks: SocialLink[] = parseExternalLinks(user.externalLinks);

  const [links, setLinks] = useState<SocialLink[]>(existingLinks);
  const [newLink, setNewLink] = useState<Partial<SocialLink>>({
    platform: "github",
    url: "",
    label: "",
  });

  const _linksForm = useForm({
    resolver: zodResolver(socialLinksFormSchema),
    defaultValues: {
      links: existingLinks,
    },
  });

  const socialLinksMutation = useMutation({
    mutationFn: async (updatedLinks: SocialLink[]) => {
      // Convert links array to the format expected by the API
      const externalLinks = JSON.stringify(
        updatedLinks.map((link) => ({
          platform: link.platform,
          url: link.url,
          username: link.label,
        })),
      );

      // Create FormData for server action
      const formData = new FormData();
      formData.append("externalLinks", externalLinks);

      const result = await updateProfileAction(formData);

      if (!result.success) {
        throw new Error(result.message || "Failed to update social links");
      }

      return result;
    },
    onSuccess: async () => {
      setIsSuccess(true);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error) => {
      logger.error("Failed to update social links", error);
    },
  });

  const addLink = () => {
    if (!newLink.url || !newLink.platform) {
      return;
    }

    const url = newLink.url.startsWith("http") ? newLink.url : `https://${newLink.url}`;

    if (!validateSocialUrl(newLink.platform, url)) {
      // You could show an error message here
      return;
    }

    const linkToAdd: SocialLink = {
      id: Date.now().toString(),
      platform: newLink.platform,
      url,
      label: newLink.label,
    };

    setLinks([...links, linkToAdd]);
    setNewLink({ platform: "github", url: "", label: "" });
    setIsAddingLink(false);
  };

  const removeLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const saveLinks = () => {
    socialLinksMutation.mutate(links);
  };

  const cancelAddLink = () => {
    setIsAddingLink(false);
    setNewLink({ platform: "github", url: "", label: "" });
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Social links updated successfully!</AlertDescription>
        </Alert>
      )}

      {/* OAuth Connected Accounts */}
      <ConnectedAccountsCard accounts={user.accounts} />

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
                <SocialLinkRow key={link.id} link={link} onRemove={removeLink} />
              ))}
            </div>
          )}

          {/* Add New Link */}
          {isAddingLink ? (
            <AddLinkForm
              newLink={newLink}
              onNewLinkChange={setNewLink}
              onAdd={addLink}
              onCancel={cancelAddLink}
            />
          ) : (
            <Button variant="outline" onClick={() => setIsAddingLink(true)} className="w-full">
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
      <HelpCard />
    </div>
  );
}
