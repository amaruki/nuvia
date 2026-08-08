"use client";

import { TestTube, Star, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentGateway } from "@/types/finance";

interface ModalFooterProps {
  gateway: PaymentGateway;
  testing: boolean;
  onOpenChange: (open: boolean) => void;
  onTest: () => void;
  onToggleStatus: () => void;
  onSetDefault: () => void;
}

export default function ModalFooter({
  gateway,
  testing,
  onOpenChange,
  onTest,
  onToggleStatus,
  onSetDefault,
}: ModalFooterProps) {
  return (
    <div className="flex justify-end space-x-2 pt-6 border-t">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Close
      </Button>
      <Button onClick={onTest} disabled={testing}>
        <TestTube className="mr-2 h-4 w-4" />
        {testing ? "Testing..." : "Test Connection"}
      </Button>
      {!gateway.isDefault && (
        <Button variant="outline" onClick={onSetDefault}>
          <Star className="mr-2 h-4 w-4" />
          Set as Default
        </Button>
      )}
      <Button variant={gateway.isEnabled ? "destructive" : "default"} onClick={onToggleStatus}>
        {gateway.isEnabled ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Disable
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Enable
          </>
        )}
      </Button>
    </div>
  );
}
