"use client";

interface TarotIntroProps {
  compact?: boolean;
}

function SectionLabel({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <span
      className={`mb-1.5 inline-block rounded-md border border-app-gold/35 bg-app-gold/10 px-2 py-0.5 font-semibold tracking-wide text-app-gold ${
        compact ? "text-[10px]" : "text-[11px]"
      }`}
    >
      {children}
    </span>
  );
}

/** 塔罗 AI 介绍 */
export default function TarotIntro({ compact }: TarotIntroProps) {
  const bodyClass = compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed";

  return (
    <div
      className={`app-card ${compact ? "!p-3" : "!p-4"}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-app-gold/15 text-base">🔮</span>
        <div>
          <h3 className={`font-semibold text-app-gold ${compact ? "text-xs" : "text-sm"}`}>什么是塔罗 AI？</h3>
          <p className={`text-app-muted ${compact ? "text-[10px]" : "text-[11px]"}`}>韦特系塔罗 · AI 深度解读</p>
        </div>
      </div>

      <div className={`space-y-3 text-app-text/90 ${bodyClass}`}>
        <p>
          塔罗牌是一套象征符号系统，通过抽牌与牌阵排列，映照你当下的能量状态与可能走向。它不是「算命定论」，而是帮助你理清思路、看见选择的镜子。
        </p>

        <div>
          <SectionLabel compact={compact}>如何提问</SectionLabel>
          <p className="text-app-text/85">
            问题尽量具体、清晰，例如「这两个 offer 我选哪个更好？」比「我该怎么办？」更容易得到针对性指引。占卜前建议找安静环境，深呼吸，专注默念问题。
          </p>
        </div>

        <div>
          <SectionLabel compact={compact}>如何抽牌</SectionLabel>
          <p className="text-app-text/85">
            输入问题后进入洗牌 → 凭直觉选 <strong className="font-semibold text-app-gold">3 张牌</strong> → 确认牌阵后点击 <strong className="font-semibold text-app-gold">AI解读牌阵</strong>。三牌阵分别代表 <strong className="font-semibold text-app-gold">过去 · 现在 · 未来</strong>。
          </p>
        </div>

        <div>
          <SectionLabel compact={compact}>温馨提示</SectionLabel>
          <p className="text-app-text/85">
            同一问题不建议短时间内反复占卜；结果供自我探索参考，重大决策请结合现实情况判断。
          </p>
        </div>
      </div>
    </div>
  );
}
