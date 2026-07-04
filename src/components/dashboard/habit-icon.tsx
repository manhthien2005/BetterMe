"use client";

import {
  AlarmClock,
  BookOpen,
  Code2,
  Dumbbell,
  HeartPulse,
  Laptop,
  Languages,
  Moon,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Star,
  Target
} from "lucide-react";

import { habitIcon } from "@/lib/defaults";
import { cn } from "@/lib/utils";

const icons = {
  AlarmClock,
  BookOpen,
  Code2,
  Dumbbell,
  HeartPulse,
  Laptop,
  Languages,
  Moon,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Star,
  Target
};

type IconName = keyof typeof icons;

export function HabitIcon({
  habitKey,
  category,
  className
}: {
  habitKey: string;
  category?: string;
  className?: string;
}) {
  const iconName = habitIcon(habitKey, category) as IconName;
  const Icon = icons[iconName] || Star;

  return <Icon className={cn("h-4 w-4", className)} />;
}
