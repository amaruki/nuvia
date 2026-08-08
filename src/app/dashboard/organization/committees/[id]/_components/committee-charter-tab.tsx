import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { Committee } from "@/types/committee";

interface CommitteeCharterTabProps {
  committee: Committee;
}

export function CommitteeCharterTab({ committee }: CommitteeCharterTabProps) {
  return (
    <TabsContent value="charter" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Committee Charter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Mission Statement</h4>
            <p className="text-sm text-muted-foreground">{committee.charter.missionStatement}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Responsibilities</h4>
            <ul className="space-y-1">
              {committee.charter.responsibilities.map((responsibility, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {responsibility}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Decision Making Process</h4>
              <p className="text-sm text-muted-foreground">
                {committee.charter.decisionMakingProcess}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Reporting Structure</h4>
              <p className="text-sm text-muted-foreground">
                {committee.charter.reportingStructure}
              </p>
            </div>
          </div>

          {committee.charter.termLimits && (
            <div>
              <h4 className="text-sm font-medium mb-2">Term Limits</h4>
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Chair Term:</span>
                  <span className="ml-2 font-medium">
                    {committee.charter.termLimits.chairTerm} months
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Member Term:</span>
                  <span className="ml-2 font-medium">
                    {committee.charter.termLimits.memberTerm} months
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Terms:</span>
                  <span className="ml-2 font-medium">{committee.charter.termLimits.maxTerms}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
