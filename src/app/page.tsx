"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sparkles, TrendingUp, MessageCircle, FileText, Users,
  UserRound, ShoppingBag, Hand, Sun,
} from "lucide-react";
import PageCarouselBanner from "@/components/PageCarouselBanner";
import HexagramIconMini from "@/components/icons/HexagramIconMini";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import { BRAND_SLOGAN_LINES } from "@/lib/brand";
import { PAGE_BANNERS } from "@/lib/page-banners";
import { ensurePrimaryPersonBeforeCalc } from "@/lib/person-store";

const PRIMARY_ROW1 = [
  { href: "/spirit-pet", emoji: "🦄", label: "AI 灵宠", desc: "守护灵宠" },
  { href: "/lifekline", icon: TrendingUp, label: "人生K线", desc: "命势可视化" },
  { href: "/liuyao", hexagram: true, label: "AI六爻", desc: "卦象占卜" },
];

const PRIMARY_ROW2 = [
  { href: "/lifekline?tab=bazi", icon: Sparkles, label: "八字排盘", desc: "四柱八字" },
  { href: "/xiang", icon: Hand, label: "AI看相", desc: "手相面相" },
  { type: "fortune-guide" as const, icon: Sun, label: "今日运势指引", desc: "每日运势" },
];

const SECONDARY = [
  { href: "/shop", icon: ShoppingBag, label: "灵宠商城" },
  { href: "/ask?from=spirit-pet", icon: MessageCircle, label: "问AI灵宠" },
  { href: "/master", icon: UserRound, label: "问真人大师" },
  { href: "/records", icon: FileText, label: "我的测算" },
  { href: "/community", icon: Users, label: "社区" },
  { href: "/lifekline", icon: FileText, label: "运势报告" },
];

export default function HomePage() {
  const router = useRouter();
  const [primaryModalOpen, setPrimaryModalOpen] = useState(false);

  const goDailyFortuneGuide = () => {
    if (!ensurePrimaryPersonBeforeCalc()) {
      setPrimaryModalOpen(true);
      return;
    }
    router.push("/ask?from=spirit-pet&section=daily-fortune");
  };

  return (
    <div className="pb-6">
      <section className="page-section pt-2 text-center">
        {BRAND_SLOGAN_LINES.map((line, i) => (
          <p key={line} className={i === 0 ? "heading-1" : "page-subtitle mt-1"}>{line}</p>
        ))}
      </section>

      <PageCarouselBanner slides={PAGE_BANNERS.home} className="!mb-4 !pt-0" />

      <Link href="/lifekline" className="app-btn-gold app-btn-sm mb-3 flex items-center justify-center gap-2">
        马上测算我的人生 K 线！
      </Link>

      {/* 核心功能 */}
      <section className="page-section">
        <p className="section-label">核心功能</p>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {PRIMARY_ROW1.map((item) => {
            const Icon = "icon" in item ? item.icon : null;
            return (
            <Link key={item.label} href={item.href} className="module-card-featured !py-3">
              <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-app-accent/15">
                {"emoji" in item && item.emoji ? (
                  <span className="text-2xl leading-none">{item.emoji}</span>
                ) : "hexagram" in item && item.hexagram ? (
                  <HexagramIconMini className="text-app-accent" />
                ) : Icon ? (
                  <Icon className="h-5 w-5 text-app-accent" strokeWidth={1.8} />
                ) : null}
              </div>
              <span className="caption font-semibold text-app-text">{item.label}</span>
              <span className="micro mt-0.5">{item.desc}</span>
            </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PRIMARY_ROW2.map((item) => {
            if ("type" in item && item.type === "fortune-guide") {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={goDailyFortuneGuide}
                  className="module-card-featured !py-3 text-left"
                >
                  <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-app-gold/15">
                    <Icon className="h-5 w-5 text-app-gold" strokeWidth={1.8} />
                  </div>
                  <span className="caption font-semibold text-app-text">{item.label}</span>
                  <span className="micro mt-0.5">{item.desc}</span>
                </button>
              );
            }
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="module-card-featured !py-3">
                <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-app-gold/15">
                  <Icon className="h-5 w-5 text-app-gold" strokeWidth={1.8} />
                </div>
                <span className="caption font-semibold text-app-text">{item.label}</span>
                <span className="micro mt-0.5">{item.desc}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <Link href="/spirit-pet" className="app-btn-gold app-btn-sm mb-5 flex items-center justify-center gap-2">
        <span className="text-base">🦄</span>
        马上收养我的第一只灵宠！
      </Link>

      {/* 更多服务 */}
      <section className="page-section">
        <p className="section-label">更多服务</p>
        <div className="grid grid-cols-3 gap-2">
          {SECONDARY.map(({ href, icon: Icon, label }) => (
            <Link key={label} href={href} className="module-card !p-2">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-app-bg">
                <Icon className="h-3.5 w-3.5 text-app-gold" strokeWidth={1.8} />
              </div>
              <span className="micro text-app-text">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="caption mt-6 text-center">仅供娱乐参考 · 不构成决策建议</p>

      <PrimaryPersonModal open={primaryModalOpen} onClose={() => setPrimaryModalOpen(false)} />
    </div>
  );
}
