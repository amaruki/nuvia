import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Link } from "lucide-react";

import { socialPlatforms, type OAuthAccount } from "./platforms";

// Platforms the auth provider supports OAuth login for; the rest are
// link-only.
const OAUTH_PLATFORM_KEYS = ["twitter", "github", "linkedin"];

interface ConnectedAccountsCardProps {
  accounts?: OAuthAccount[];
}

export function ConnectedAccountsCard({ accounts }: ConnectedAccountsCardProps) {
  return (
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
            .filter(([key]) => OAUTH_PLATFORM_KEYS.includes(key))
            .map(([key, platform]) => {
              const Icon = platform.icon;
              const isConnected = accounts?.some(
                (account) => account.provider.toLowerCase() === key,
              );

              return (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${platform.color}`} />
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {isConnected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isConnected} disabled />
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Connect"}
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
  );
}
