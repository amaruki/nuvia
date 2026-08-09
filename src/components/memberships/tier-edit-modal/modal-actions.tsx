import { Button } from "@/components/ui/button";

interface ModalActionsProps {
  onCancel: () => void;
  onSave: () => void;
}

export default function ModalActions({ onCancel, onSave }: ModalActionsProps) {
  return (
    <div className="flex justify-end items-center pt-4 border-t">
      <Button variant="outline" onClick={onCancel} className="mr-2">
        Cancel
      </Button>
      <Button onClick={onSave}>Save Changes</Button>
    </div>
  );
}
