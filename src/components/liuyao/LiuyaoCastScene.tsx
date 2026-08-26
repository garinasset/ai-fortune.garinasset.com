"use client";

import Image from "next/image";

type CoinSide = 2 | 3;

/** 仿古铜钱 — 参考实物：铜绿锈、方孔、通宝 */
export function AncientCoin({
  side,
  tossing,
  delay = 0,
  size = "md",
}: {
  side?: CoinSide | null;
  tossing?: boolean;
  delay?: number;
  size?: "xs" | "sm" | "md";
}) {
  const isBack = side === 3;
  const showBack = side === null || side === undefined ? false : isBack;
  const dim =
    size === "xs" ? "h-8 w-8" : size === "sm" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem]";
  const hole =
    size === "xs" ? "h-2 w-2" : size === "sm" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-[1.2rem] w-[1.2rem] sm:h-[1.35rem] sm:w-[1.35rem]";

  return (
    <div
      className={`relative ${tossing ? "animate-liuyao-coin-toss" : ""}`}
      style={tossing ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div
        className={`relative flex ${dim} items-center justify-center rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.45)] ring-1 ring-amber-900/50 ${
          showBack
            ? "bg-gradient-to-br from-stone-500 via-amber-800 to-stone-900"
            : "bg-gradient-to-br from-teal-900/80 via-amber-800 to-stone-800"
        }`}
      >
        <div className={`absolute ${hole} rounded-[3px] bg-stone-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]`} />

        {!showBack ? (
          size === "xs" ? null : (
          <>
            <span className="absolute top-1.5 text-[7px] font-serif text-amber-200/90 sm:text-[8px]">乾</span>
            <span className="absolute bottom-1.5 text-[7px] font-serif text-amber-200/90 sm:text-[8px]">隆</span>
            <span className="absolute left-1 text-[6px] font-serif text-amber-200/80 sm:text-[7px]">通</span>
            <span className="absolute right-1 text-[6px] font-serif text-amber-200/80 sm:text-[7px]">宝</span>
          </>
          )
        ) : (
          size === "xs" ? null : (
          <span className="text-[8px] font-serif text-amber-300/70">背</span>
          )
        )}

        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-full opacity-40 mix-blend-multiply bg-[radial-gradient(circle_at_70%_80%,rgba(20,40,30,0.6),transparent_50%)]" />
      </div>
    </div>
  );
}

interface LiuyaoCastSceneProps {
  sides: (CoinSide | null)[];
  tossing: boolean;
  /** 介绍页等小尺寸装饰 */
  mini?: boolean;
}

/** 龟壳 + 三枚铜钱场景（参考实物图） */
export default function LiuyaoCastScene({ sides, tossing, mini }: LiuyaoCastSceneProps) {
  if (mini) {
    return (
      <div className="mx-auto flex max-w-[200px] flex-col items-center py-1">
        <Image
          src="/images/liuyao/shell-top.png"
          alt=""
          width={80}
          height={96}
          className="h-auto w-16 object-contain opacity-90 drop-shadow-md"
        />
        <div className="-mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-stone-700/30 bg-stone-950/50 px-2.5 py-2">
          {sides.map((side, i) => (
            <AncientCoin key={i} side={side} size="xs" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative mx-auto w-full max-w-sm ${tossing ? "animate-liuyao-shake" : ""}`}>
      {/* 龟壳 */}
      <div className="relative mx-auto flex justify-center">
        <Image
          src="/images/liuyao/shell-top.png"
          alt="占卜龟壳"
          width={220}
          height={260}
          className="h-auto w-[min(220px,55vw)] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          priority
        />
      </div>

      {/* 龟壳前承盘 + 三枚铜钱 */}
      <div className="relative -mt-6 mx-auto max-w-[280px] rounded-2xl border border-stone-700/40 bg-gradient-to-b from-stone-900/60 to-black/70 px-3 pb-4 pt-8 shadow-inner">
        <div className="pointer-events-none absolute inset-x-4 top-2 h-px bg-amber-700/20" />
        <div className="flex items-end justify-center gap-3 sm:gap-4">
          {sides.map((side, i) => (
            <AncientCoin key={i} side={side} tossing={tossing} delay={i * 90} size="md" />
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-amber-700/60">三枚铜钱 · 龟壳承卦</p>
      </div>
    </div>
  );
}
