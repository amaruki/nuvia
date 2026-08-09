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
      return "bg-info/15 text-info";
    case "download":
      return "bg-success/15 text-success";
    case "edit":
      return "bg-warning/15 text-warning";
    case "delete":
      return "bg-destructive/15 text-destructive";
    case "share":
      return "bg-primary/15 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
};
