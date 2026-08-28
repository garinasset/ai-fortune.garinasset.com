"use client";

import { DEMO_LIUYAO } from "@/lib/demo-data";

/** 首页 AI 六爻示例：六条蓝线 + 卦象信息，紧凑展示 */
export default function LiuyaoDemoCard() {
  const lines = [...DEMO_LIUYAO.lines].reverse();

  return (
    <div className="app-card flex flex-col items-center !py-2 !px-3">
      <div className="flex flex-col items-center gap-[3px] py-0.5">
        {lines.map((line, i) => (
          <div key={i} className="flex h-[5px] w-14 items-center justify-center">
            {line.isYang ? (
              <span className="block h-[3px] w-full rounded-[1px] bg-sky-500" />
            ) : (
              <span className="flex w-full justify-between gap-2">
                <span className="block h-[3px] w-[26px] rounded-[1px] bg-sky-500" />
                <span className="block h-[3px] w-[26px] rounded-[1px] bg-sky-500" />
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 text-center">
        {(DEMO_LIUYAO.upperTrigram && DEMO_LIUYAO.lowerTrigram) && (
          <p className="text-[9px] text-app-muted">
            上{DEMO_LIUYAO.upperTrigram} · 下{DEMO_LIUYAO.lowerTrigram}
            {DEMO_LIUYAO.trigramLabel ? `（${DEMO_LIUYAO.trigramLabel}）` : ""}
          </p>
        )}
        <p className="text-xs font-semibold text-app-gold">
          {DEMO_LIUYAO.guaName}卦
          <span className="mx-1 font-normal text-app-muted">·</span>
          <span className="text-[11px] font-medium text-emerald-500">{DEMO_LIUYAO.luck}</span>
        </p>
        <p className="mt-0.5 text-[10px] text-app-muted">{DEMO_LIUYAO.guaDesc}</p>
      </div>
    </div>
  );
}
