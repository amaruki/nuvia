import { Card, CardContent } from "@/components/ui/card";

import { Check, Shield } from "lucide-react";

import type { PasswordRequirements } from "./password-strength";

interface PasswordRequirementsCardProps {
  requirements: PasswordRequirements;
}

export function PasswordRequirementsCard({ requirements }: PasswordRequirementsCardProps) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Password Requirements:
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li
            className={`flex items-center gap-2 ${requirements.minLength ? "text-green-600" : ""}`}
          >
            {requirements.minLength ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <span className="w-3 h-3 inline-block" />
            )}
            At least 8 characters long
          </li>
          <li
            className={`flex items-center gap-2 ${requirements.hasUppercase ? "text-green-600" : ""}`}
          >
            {requirements.hasUppercase ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <span className="w-3 h-3 inline-block" />
            )}
            Contains uppercase letter
          </li>
          <li
            className={`flex items-center gap-2 ${requirements.hasLowercase ? "text-green-600" : ""}`}
          >
            {requirements.hasLowercase ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <span className="w-3 h-3 inline-block" />
            )}
            Contains lowercase letter
          </li>
          <li
            className={`flex items-center gap-2 ${requirements.hasNumber ? "text-green-600" : ""}`}
          >
            {requirements.hasNumber ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <span className="w-3 h-3 inline-block" />
            )}
            Contains number
          </li>
          <li
            className={`flex items-center gap-2 ${requirements.hasSpecialChar ? "text-green-600" : ""}`}
          >
            {requirements.hasSpecialChar ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <span className="w-3 h-3 inline-block" />
            )}
            Contains special character
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
