import {
  Home,
  Plane,
  Sparkles,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { GroupIcon as GroupIconType } from "@/lib/types";

const ICON_LABELS: Record<GroupIconType, string> = {
  wallet: "icons.wallet",
  plane: "icons.plane",
  utensils: "icons.utensils",
  home: "icons.home",
  sparkles: "icons.sparkles",
};

const icons: Record<GroupIconType, LucideIcon> = {
  wallet: WalletCards,
  plane: Plane,
  utensils: Utensils,
  home: Home,
  sparkles: Sparkles,
};

export const GROUP_ICON_OPTIONS: GroupIconType[] = [
  "wallet",
  "plane",
  "utensils",
  "home",
  "sparkles",
];

export function getGroupIconLabel(
  icon: GroupIconType,
  t: (key: string) => string,
) {
  return t(ICON_LABELS[icon]);
}

export function GroupIcon({
  icon,
  className,
}: {
  icon: GroupIconType;
  className?: string;
}) {
  const Icon = icons[icon] ?? WalletCards;

  return <Icon className={className} />;
}
