"use client";

const SPREADS = [
  { name: "三牌阵", desc: "过去 · 现在 · 未来，适合看趋势走向" },
  { name: "凯尔特十字", desc: "十张牌深度剖析复杂局面（进阶玩法）" },
  { name: "每日一牌", desc: "抽一张牌作为今日能量指引" },
  { name: "是/否牌阵", desc: "快速获得直觉层面的答案参考" },
];

const MAJOR_ARCANA = [
  { name: "愚者", hint: "新的开始、冒险与信任直觉" },
  { name: "恋人", hint: "选择、关系与价值观" },
  { name: "命运之轮", hint: "转机、周期与顺势而为" },
  { name: "太阳", hint: "明朗、成功与生命力" },
];

const TIPS = [
  "提问尽量具体，例如「未来三个月这段感情如何发展」比「我的感情怎么样」更清晰。",
  "正位与逆位代表能量顺畅或受阻，并非简单的「好/坏」。",
  "塔罗是映照当下能量与选择的工具，最终决策权始终在你手中。",
  "同一问题建议间隔一段时间再问，给变化留出空间。",
];

/** 塔罗底部「查看更多」知识区（完全展开） */
export default function TarotExploreMore() {
  return (
    <div className="app-card !p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-app-gold">查看更多</p>
        <p className="text-[11px] text-app-muted">牌阵玩法 · 大阿卡纳 · 占卜小贴士</p>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="mb-2 text-xs font-semibold text-app-text">常见牌阵</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {SPREADS.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-app-border/40 bg-app-bg/40 px-2.5 py-2"
              >
                <p className="text-xs font-medium text-app-gold">{s.name}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-app-text/85">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold text-app-text">大阿卡纳速览</h4>
          <div className="flex flex-wrap gap-1.5">
            {MAJOR_ARCANA.map((c) => (
              <span
                key={c.name}
                title={c.hint}
                className="rounded-full border border-app-gold/30 bg-app-gold/8 px-2 py-0.5 text-[10px] text-app-text"
              >
                {c.name}
              </span>
            ))}
            <span className="rounded-full border border-app-border/40 px-2 py-0.5 text-[10px] text-app-muted">
              + 78 张韦特系牌义
            </span>
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold text-app-text">占卜小贴士</h4>
          <ul className="space-y-1.5">
            {TIPS.map((tip) => (
              <li key={tip} className="text-[11px] leading-relaxed text-app-text/85">
                · {tip}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
