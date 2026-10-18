// Public modules linked from the home page. Not built yet: each route renders SoonPage.
import { Calendar, Dumbbell, FileText, MessageSquare, type LucideIcon } from "lucide-react";

export interface PublicModule {
  id: "trainers" | "services" | "articles" | "forum";
  to: string;
  icon: LucideIcon;
}

export const MODULES: PublicModule[] = [
  { id: "trainers", to: "/trainers", icon: Dumbbell },
  { id: "services", to: "/services", icon: Calendar },
  { id: "articles", to: "/articles", icon: FileText },
  { id: "forum", to: "/forum", icon: MessageSquare },
];
