import { Card, CardContent } from "@/components/ui/card";

export function HelpCard() {
  return (
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
  );
}
