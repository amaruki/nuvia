import { TestTube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import type { GatewayTestResult, PaymentGateway } from "@/types/finance";

interface TestsTabProps {
  gateway: PaymentGateway;
  testResults: GatewayTestResult[];
}

export default function TestsTab({ gateway, testResults }: TestsTabProps) {
  const recentTestResults = testResults.filter((t) => t.gatewayId === gateway.id).slice(0, 5);

  return (
    <TabsContent value="tests" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Recent Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTestResults.length > 0 ? (
            <div className="space-y-3">
              {recentTestResults.map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          test.status === "success"
                            ? "bg-green-500"
                            : test.status === "failed"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium">{test.testType}</p>
                        <p className="text-xs text-muted-foreground">{test.message}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(test.testedAt, { addSuffix: true })}
                    </p>
                    <Badge
                      variant={
                        test.status === "success"
                          ? "default"
                          : test.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {test.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Test Results</h3>
              <p className="text-sm text-muted-foreground">
                No tests have been run for this gateway yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
