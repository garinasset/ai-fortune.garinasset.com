"use client";

import { cn } from "@/lib/utils";
import { getStageForLevel, getLevelTierClass } from "@/lib/spirit-pet-growth";

interface SpiritLevelBadgeProps {
  level: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  icon?: string;
}

export default function SpiritLevelBadge({
  level,
  className,
  size = "md",
  showName = true,
  icon,
}: SpiritLevelBadgeProps) {
  const stage = getStageForLevel(level);
  return (
    <span
      className={cn(
        "spirit-level-name",
        size === "sm" && "spirit-level-name-sm",
        size === "md" && "spirit-level-name-md",
        size === "lg" && "spirit-level-name-lg",
        getLevelTierClass(level),
        className,
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span className="spirit-level-prefix">LV</span>
      <span className="spirit-level-num">{stage.level}</span>
      {showName && <span className="spirit-level-title">{stage.name}</span>}
    </span>
  );
}
