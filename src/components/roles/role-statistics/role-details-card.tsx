import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_DISPLAY_INFO } from "@/types/role";
import type { RoleStatisticsSectionProps } from "./types";

export function RoleDetailsCard({ data }: RoleStatisticsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Details</CardTitle>
        <CardDescription>Complete breakdown of all roles and their user counts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-1 divide-y">
            {data.roleBreakdown.map((item) => {
              const roleInfo = ROLE_DISPLAY_INFO[item.role as keyof typeof ROLE_DISPLAY_INFO];
              const isCustom = !roleInfo;

              return (
                <div key={item.role} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={isCustom ? "secondary" : "outline"}>{item.role}</Badge>
                        {isCustom && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{roleInfo?.name || item.role}</div>
                        <div className="text-sm text-muted-foreground">
                          {roleInfo?.description || "Custom role"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.count.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.percentage}% of users
                      </div>
                    </div>
                  </div>
                  {item.count > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
