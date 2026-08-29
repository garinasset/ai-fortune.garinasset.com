"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, ChevronRight } from "lucide-react";
import { getPrimaryPerson } from "@/lib/person-store";
import { getOrCreateUser } from "@/lib/user-store";
import {
  ensureDailyFortuneLoaded,
  getCachedDailyFortune,
  todayDateKey,
} from "@/lib/daily-fortune-store";
import type { DailyFortuneGuide } from "@/lib/types";

interface TodayDailyFortuneCardProps {
  onNeedPrimary?: () => void;
}

export default function TodayDailyFortuneCard({ onNeedPrimary }: TodayDailyFortuneCardProps) {
  const [guide, setGuide] = useState<DailyFortuneGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [noPrimary, setNoPrimary] = useState(false);

  useEffect(() => {
    const primary = getPrimaryPerson();
    if (!primary?.birthInfo) {
      setNoPrimary(true);
      setLoading(false);
      return;
    }

    const user = getOrCreateUser();
    const birth = primary.birthInfo;
    const cached = getCachedDailyFortune(user.id, birth, todayDateKey());
    if (cached) {
      setGuide(cached);
      setLoading(false);
      return;
    }

    ensureDailyFortuneLoaded(user.id, birth)
      .then((data) => setGuide(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-section mb-5">
      <div className="app-card overflow-hidden border-app-accent/25 bg-gradient-to-br from-[#1a2030]/35 via-app-card to-app-bg/80 !p-0">
        <div className="flex items-start gap-2 border-b border-app-border/60 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-accent/15">
            <Sun className="h-4 w-4 text-app-accent" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-app-accent">今日运势指引</p>
            <p className="text-[10px] text-app-muted">八字推算 · {todayDateKey()}</p>
          </div>
          {!noPrimary && (
            <Link
              href="/ask?from=spirit-pet&section=daily-fortune"
              className="caption flex shrink-0 items-center gap-0.5 text-app-accent"
            >
              详情 <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="space-y-3 px-4 py-3">
          {loading && (
            <p className="caption animate-pulse py-4 text-center text-app-muted">正在推算今日运势…</p>
          )}

          {noPrimary && !loading && (
            <div className="rounded-xl border border-app-border/60 bg-app-bg/50 px-3 py-4 text-center">
              <p className="caption text-app-muted">设置主测算人后可查看今日运势</p>
              <button
                type="button"
                onClick={onNeedPrimary}
                className="app-btn-gold mt-2 px-4 py-1.5 text-xs"
              >
                设置主测算人
              </button>
            </div>
          )}

          {guide && !loading && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {guide.dimensions.map((dim) => (
                  <div
                    key={dim.key}
                    className="rounded-lg border border-app-border/50 bg-app-bg/40 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-app-muted">{dim.label}</span>
                      <span className="text-[10px] font-bold text-app-accent">{dim.score}</span>
                    </div>
                    <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-app-border">
                      <div
                        className="h-full rounded-full bg-app-accent"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-medium text-app-gold">吉祥元素</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "幸运颜色", value: guide.lucky.color },
                    { label: "幸运数字", value: guide.lucky.number },
                    { label: "吉位", value: guide.lucky.direction },
                    { label: "吉时", value: guide.lucky.time },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-1 rounded-lg border border-app-gold/20 bg-app-gold/8 px-2 py-1.5"
                    >
                      <span className="shrink-0 text-[9px] text-app-muted">{label}</span>
                      <span className="truncate text-[11px] font-medium text-app-text">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
