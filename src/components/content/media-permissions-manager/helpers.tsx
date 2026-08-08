import {
  Building,
  Download,
  Edit,
  Eye,
  Lock,
  Share2,
  Shield,
  Trash2,
  User,
  Users,
  Users2,
} from "lucide-react";

export const getEntityTypeIcon = (entityType: string) => {
  switch (entityType) {
    case "user":
      return <User className="h-4 w-4" />;
    case "role":
      return <Shield className="h-4 w-4" />;
    case "chapter":
      return <Building className="h-4 w-4" />;
    case "committee":
      return <Users2 className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
};

export const getPermissionIcon = (permission: string) => {
  switch (permission) {
    case "view":
      return <Eye className="h-3 w-3" />;
    case "download":
      return <Download className="h-3 w-3" />;
    case "edit":
      return <Edit className="h-3 w-3" />;
    case "delete":
      return <Trash2 className="h-3 w-3" />;
    case "share":
      return <Share2 className="h-3 w-3" />;
    default:
      return <Lock className="h-3 w-3" />;
  }
};

export const getPermissionColor = (permission: string) => {
  switch (permission) {
    case "view":
      return "bg-blue-100 text-blue-800";
    case "download":
      return "bg-green-100 text-green-800";
    case "edit":
      return "bg-yellow-100 text-yellow-800";
    case "delete":
      return "bg-red-100 text-red-800";
    case "share":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
