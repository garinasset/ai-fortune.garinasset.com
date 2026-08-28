"use client";

import { useEffect, useState } from "react";
import type { BirthInfo, DailyFortuneGuide, SpiritPetProfile } from "@/lib/types";
import { getOrCreateUser } from "@/lib/user-store";
import {
  ensureDailyFortuneLoaded,
  getCachedDailyFortune,
  todayDateKey,
} from "@/lib/daily-fortune-store";
import SectionCard from "@/components/ui/SectionCard";

interface SpiritPetDailyAdviceProps {
  birth: BirthInfo;
  pet?: SpiritPetProfile | null;
}

/** 今日运势指引 · 每日生成（不消耗灵丹） */
export default function SpiritPetDailyAdvice({ birth, pet }: SpiritPetDailyAdviceProps) {
  const [guide, setGuide] = useState<DailyFortuneGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getOrCreateUser();
    const cached = getCachedDailyFortune(user.id, birth, todayDateKey());
    if (cached) {
      setGuide(cached);
      return;
    }

    setLoading(true);
    setError(null);
    ensureDailyFortuneLoaded(user.id, birth)
      .then((data) => setGuide(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "今日运势加载失败");
      })
      .finally(() => setLoading(false));
  }, [birth]);

  const subtitle = pet
    ? `${pet.fullName} 结合你的命盘 · ${todayDateKey()}`
    : `结合主测算人命盘 · ${todayDateKey()}`;

  return (
    <SectionCard
      id="daily-fortune-guide"
      variant="fortune"
      title="今日运势指引"
      subtitle={subtitle}
      className="mt-3 scroll-mt-4"
    >
      {loading && (
        <p className="caption animate-pulse py-6 text-center text-app-accent">正在生成今日运势…</p>
      )}

      {error && !loading && (
        <p className="caption py-4 text-center text-red-400">{error}</p>
      )}

      {guide && !loading && (
        <>
          <p className="mb-2 block-label text-app-gold">今日运势</p>
          <div className="grid grid-cols-2 gap-2">
            {guide.dimensions.map((dim) => (
              <div
                key={dim.key}
                className="rounded-xl border border-app-border/60 bg-app-bg/40 px-3 py-2.5 text-left"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="block-label text-app-gold">{dim.label}</p>
                  <span className="text-xs font-bold text-app-accent">{dim.score}分</span>
                </div>
                <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-app-border">
                  <div className="h-full rounded-full bg-app-accent" style={{ width: `${dim.score}%` }} />
                </div>
                <p className="caption leading-snug text-app-text">{dim.text}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-4 block-label text-app-gold">吉祥元素</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "幸运颜色", value: guide.lucky.color },
              { label: "幸运数字", value: guide.lucky.number },
              { label: "吉位", value: guide.lucky.direction },
              { label: "吉时", value: guide.lucky.time },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-app-gold/25 bg-app-gold/8 px-3 py-2.5"
              >
                <p className="block-label text-app-muted">{label}</p>
                <p className="caption mt-1 font-medium text-app-text">{value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
