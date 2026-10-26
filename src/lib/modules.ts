// Public modules linked from the home page. `soon` = not built yet: the route renders SoonPage.
import { Calendar, Dumbbell, FileText, MessageSquare, type LucideIcon } from "lucide-react";

export interface PublicModule {
  id: "trainers" | "services" | "articles" | "forum";
  to: string;
  icon: LucideIcon;
  soon?: boolean;
}

export const MODULES: PublicModule[] = [
  { id: "trainers", to: "/trainers", icon: Dumbbell, soon: true },
  { id: "services", to: "/services", icon: Calendar, soon: true },
  { id: "articles", to: "/articles", icon: FileText },
  { id: "forum", to: "/forum", icon: MessageSquare, soon: true },
];
