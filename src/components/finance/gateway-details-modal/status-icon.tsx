import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "inactive":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "testing":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}
