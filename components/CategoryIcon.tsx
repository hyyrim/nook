import {
  Bike,
  BookOpen,
  Bookmark,
  Briefcase,
  Camera,
  Coffee,
  Cpu,
  Dumbbell,
  Film,
  Folder,
  Gift,
  Heart,
  House,
  Inbox,
  Leaf,
  Lightbulb,
  Music,
  Palette,
  Pencil,
  Plane,
  Rocket,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import type { CategoryIconName } from '@/constants/categoryStyle';

type CategoryIconProps = {
  name: CategoryIconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const ICONS: Record<CategoryIconName, LucideIcon> = {
  sparkles: Sparkles,
  cpu: Cpu,
  'trending-up': TrendingUp,
  briefcase: Briefcase,
  rocket: Rocket,
  palette: Palette,
  house: House,
  plane: Plane,
  utensils: Utensils,
  music: Music,
  film: Film,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  bookmark: Bookmark,
  tag: Tag,
  heart: Heart,
  star: Star,
  camera: Camera,
  leaf: Leaf,
  coffee: Coffee,
  bike: Bike,
  gift: Gift,
  pencil: Pencil,
  lightbulb: Lightbulb,
  folder: Folder,
  inbox: Inbox,
};

export function CategoryIcon({ name, size = 17, color, strokeWidth = 2 }: CategoryIconProps) {
  const Icon = ICONS[name];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
