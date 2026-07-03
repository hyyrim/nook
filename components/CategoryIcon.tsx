import * as Lucide from 'lucide-react-native';
import type { CategoryIconName } from '@/constants/categoryStyle';

type CategoryIconProps = {
  name: CategoryIconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const ICONS: Record<CategoryIconName, Lucide.LucideIcon> = {
  bookmark: Lucide.Bookmark,
  tag: Lucide.Tag,
  star: Lucide.Star,
  heart: Lucide.Heart,
  sparkles: Lucide.Sparkles,
  cpu: Lucide.Cpu,
  code: Lucide.Code,
  terminal: Lucide.Terminal,
  'trending-up': Lucide.TrendingUp,
  briefcase: Lucide.Briefcase,
  coins: Lucide.Coins,
  target: Lucide.Target,
  rocket: Lucide.Rocket,
  'graduation-cap': Lucide.GraduationCap,
  'book-open': Lucide.BookOpen,
  lightbulb: Lucide.Lightbulb,
  pencil: Lucide.Pencil,
  palette: Lucide.Palette,
  camera: Lucide.Camera,
  image: Lucide.Image,
  house: Lucide.House,
  sofa: Lucide.Sofa,
  plane: Lucide.Plane,
  map: Lucide.Map,
  tent: Lucide.Tent,
  utensils: Lucide.Utensils,
  coffee: Lucide.Coffee,
  wine: Lucide.Wine,
  music: Lucide.Music,
  clapperboard: Lucide.Clapperboard,
  tv: Lucide.Tv,
  newspaper: Lucide.Newspaper,
  dumbbell: Lucide.Dumbbell,
  bike: Lucide.Bike,
  medal: Lucide.Medal,
  leaf: Lucide.Leaf,
  'paw-print': Lucide.PawPrint,
  'shopping-bag': Lucide.ShoppingBag,
  gift: Lucide.Gift,
  'gamepad-2': Lucide.Gamepad2,
  car: Lucide.Car,
  folder: Lucide.Folder,
  inbox: Lucide.Inbox,
};

export function CategoryIcon({ name, size = 17, color, strokeWidth = 2 }: CategoryIconProps) {
  const Icon = ICONS[name];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
