"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { FortuneHubTab } from "@/components/FortuneHubNav";

const panelLoaders: Record<
  Exclude<FortuneHubTab, "lifekline" | "bazi">,
  () => Promise<{ default: React.ComponentType }>
> = {
  liuyao: () => import("@/components/fortune-hub/LiuyaoHubPanel"),
  tarot: () => import("@/components/fortune-hub/TarotHubPanel"),
  xiang: () => import("@/components/fortune-hub/XiangHubPanel"),
  master: () => import("@/components/fortune-hub/MasterHubPanel"),
  ask: () => import("@/components/fortune-hub/AskHubPanel"),
  records: () => import("@/components/fortune-hub/RecordsHubPanel"),
};

function HubPanelSkeleton() {
  return (
    <div className="app-card mb-3 min-h-[120px] animate-pulse !p-4">
      <div className="mx-auto h-3 w-24 rounded bg-app-border/40" />
      <div className="mx-auto mt-3 h-2 w-40 rounded bg-app-border/30" />
    </div>
  );
}

const LazyPanels = Object.fromEntries(
  (Object.entries(panelLoaders) as [keyof typeof panelLoaders, typeof panelLoaders.liuyao][]).map(
    ([tab, loader]) => [
      tab,
      dynamic(loader, { ssr: false, loading: () => <HubPanelSkeleton /> }),
    ],
  ),
) as Record<keyof typeof panelLoaders, ComponentType>;

export function LazyHubPanel({ tab }: { tab: FortuneHubTab }) {
  if (tab === "lifekline" || tab === "bazi") return null;
  const Panel = LazyPanels[tab];
  return Panel ? <Panel /> : null;
}

export const LazyBaziHubPanel = dynamic(() => import("@/components/fortune-hub/BaziHubPanel"), {
  ssr: false,
  loading: () => <HubPanelSkeleton />,
});
