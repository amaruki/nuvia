import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Award,
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Camera,
  ChartBar,
  ClipboardList,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  Gift,
  Globe,
  GraduationCap,
  Hash,
  Heart,
  Home,
  Image,
  Inbox,
  Layers,
  Library,
  Lightbulb,
  Link,
  Laptop,
  MapPin,
  Megaphone,
  MessageSquare,
  Mic,
  Music,
  Newspaper,
  Package,
  PenLine,
  Presentation,
  Rocket,
  Rss,
  Send,
  Shield,
  Star,
  StickyNote,
  Tag,
  Target,
  Trophy,
  Users,
  Video,
  Wallet,
} from "lucide-react";

export interface CategoryIconOption {
  /** Lucide icon name stored on the category, matching forum icon-map keys. */
  name: string;
  icon: LucideIcon;
}

/**
 * Curated icon vocabulary for content categories (UI-13 icon picker).
 * Names are canonical lucide identifiers so stored values stay portable;
 * existing forum category data (MessageSquare, Megaphone, Lightbulb,
 * ClipboardList) resolves here too.
 */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { name: "Folder", icon: Folder },
  { name: "FolderOpen", icon: FolderOpen },
  { name: "BookOpen", icon: BookOpen },
  { name: "Newspaper", icon: Newspaper },
  { name: "FileText", icon: FileText },
  { name: "Megaphone", icon: Megaphone },
  { name: "MessageSquare", icon: MessageSquare },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "ClipboardList", icon: ClipboardList },
  { name: "StickyNote", icon: StickyNote },
  { name: "PenLine", icon: PenLine },
  { name: "Library", icon: Library },
  { name: "Calendar", icon: Calendar },
  { name: "CalendarDays", icon: CalendarDays },
  { name: "Clock", icon: Clock },
  { name: "Briefcase", icon: Briefcase },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Award", icon: Award },
  { name: "Trophy", icon: Trophy },
  { name: "Gift", icon: Gift },
  { name: "Users", icon: Users },
  { name: "Globe", icon: Globe },
  { name: "MapPin", icon: MapPin },
  { name: "Building2", icon: Building2 },
  { name: "Home", icon: Home },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Bookmark", icon: Bookmark },
  { name: "Tag", icon: Tag },
  { name: "Hash", icon: Hash },
  { name: "Archive", icon: Archive },
  { name: "Inbox", icon: Inbox },
  { name: "Send", icon: Send },
  { name: "Link", icon: Link },
  { name: "Bell", icon: Bell },
  { name: "Rss", icon: Rss },
  { name: "Image", icon: Image },
  { name: "Video", icon: Video },
  { name: "Music", icon: Music },
  { name: "Camera", icon: Camera },
  { name: "Mic", icon: Mic },
  { name: "Presentation", icon: Presentation },
  { name: "Laptop", icon: Laptop },
  { name: "Layers", icon: Layers },
  { name: "Package", icon: Package },
  { name: "Rocket", icon: Rocket },
  { name: "Target", icon: Target },
  { name: "Shield", icon: Shield },
  { name: "Wallet", icon: Wallet },
  { name: "ChartBar", icon: ChartBar },
];

/** Case-insensitive lookup so legacy values like "folder" still resolve. */
export function findCategoryIcon(name: string | undefined): LucideIcon | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;
  return CATEGORY_ICON_OPTIONS.find((option) => option.name.toLowerCase() === normalized)?.icon;
}
