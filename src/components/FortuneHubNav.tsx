"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type FortuneHubTab =
  | "liuyao"
  | "tarot"
  | "lifekline"
  | "bazi"
  | "xiang"
  | "master"
  | "ask"
  | "records";

type TabItem = { kind: "tab"; id: FortuneHubTab; label: string };
type LinkItem = { kind: "link"; href: string; label: string };
type NavItem = TabItem | LinkItem;

/** 第一排默认展示 */
const PRIMARY_TABS: TabItem[] = [
  { kind: "tab", id: "liuyao", label: "AI六爻" },
  { kind: "tab", id: "tarot", label: "塔罗AI" },
  { kind: "tab", id: "lifekline", label: "人生K线" },
  { kind: "tab", id: "xiang", label: "AI看相" },
  { kind: "tab", id: "records", label: "我的测算" },
];

/** 点击「显示更多」后展开 */
const MORE_ITEMS: NavItem[] = [
  { kind: "tab", id: "bazi", label: "八字排盘" },
  { kind: "tab", id: "master", label: "问真人大师" },
  { kind: "tab", id: "ask", label: "问灵宠" },
  { kind: "link", href: "/ask?from=lifekline&ability=今日灵签", label: "今日灵签" },
  { kind: "link", href: "/ask?from=lifekline&section=daily-fortune", label: "今日运势指引" },
];

const MORE_TAB_IDS = new Set(
  MORE_ITEMS.filter((i): i is TabItem => i.kind === "tab").map((i) => i.id),
);

const navBtnClass = (active: boolean) =>
  cn(
    "w-full rounded-full border px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors sm:px-2 sm:text-[12px]",
    active
      ? "border-app-gold bg-app-gold/22 text-app-gold shadow-[inset_0_0_0_1px_rgba(212,165,116,0.25)]"
      : "border-app-gold/45 bg-app-gold/10 text-app-gold hover:border-app-gold hover:bg-app-gold/18",
  );

interface FortuneHubNavProps {
  active: FortuneHubTab;
  onChange: (tab: FortuneHubTab) => void;
}

function NavButton({
  item,
  active,
  onTab,
  onLink,
}: {
  item: NavItem;
  active: FortuneHubTab;
  onTab: (tab: FortuneHubTab) => void;
  onLink: (href: string) => void;
}) {
  if (item.kind === "tab") {
    return (
      <button type="button" onClick={() => onTab(item.id)} className={navBtnClass(active === item.id)}>
        {item.label}
      </button>
    );
  }
  return (
    <button type="button" onClick={() => onLink(item.href)} className={navBtnClass(false)}>
      {item.label}
    </button>
  );
}

export default function FortuneHubNav({ active, onChange }: FortuneHubNavProps) {
  const router = useRouter();
  const [showMore, setShowMore] = useState(MORE_TAB_IDS.has(active));

  useEffect(() => {
    if (MORE_TAB_IDS.has(active)) setShowMore(true);
  }, [active]);

  return (
    <div className="sticky top-0 z-20 -mx-1 mb-3 bg-app-bg/95 px-1 pb-1 backdrop-blur-sm">
      <div className="space-y-1.5">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {PRIMARY_TABS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={active}
              onTab={onChange}
              onLink={(href) => router.push(href)}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className={cn(
              navBtnClass(false),
              "flex items-center justify-center gap-0.5",
              showMore && "border-app-gold/60 bg-app-gold/15",
            )}
          >
            显示更多
            {showMore ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
          </button>
        </div>

        {showMore && (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {MORE_ITEMS.map((item) => (
              <NavButton
                key={item.kind === "tab" ? item.id : item.href}
                item={item}
                active={active}
                onTab={onChange}
                onLink={(href) => router.push(href)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
