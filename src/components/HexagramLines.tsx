"use client";

interface Line {
  isYang: boolean;
  label?: string;
  isChanging?: boolean;
}

interface HexagramLinesProps {
  lines: Line[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
  showPlaceholder?: boolean;
  totalLines?: number;
  /** 六爻起卦页加强爻线可见度 */
  emphasized?: boolean;
  /** 正在飞入、尚未写入 lines 的爻 */
  incomingLine?: Line | null;
  incomingLineIndex?: number | null;
  /** 为 true 时触发飞入动画 */
  flyActive?: boolean;
  /** 飞入结束后高亮停留 */
  highlightLineIndex?: number | null;
}

function YaoBar({
  line,
  compact,
  emphasized,
  placeholder,
  highlighted,
}: {
  line?: Line;
  compact?: boolean;
  emphasized?: boolean;
  placeholder?: boolean;
  highlighted?: boolean;
}) {
  const barH = emphasized ? "h-3" : compact ? "h-1.5" : "h-2";
  const yangW = emphasized ? "w-28" : compact ? "w-16" : "w-20";
  const yinW = emphasized ? "w-10" : compact ? "w-6" : "w-8";
  const yinGap = emphasized ? "gap-2.5" : "gap-1";
  const barSolid = emphasized
    ? "rounded-sm bg-gradient-to-r from-amber-400 via-app-gold to-amber-500 shadow-[0_0_10px_rgba(212,165,116,0.55)] ring-1 ring-amber-300/40"
    : `rounded bg-app-gold${compact ? "/80" : ""}`;
  const barChanging = emphasized
    ? "ring-2 ring-app-accent shadow-[0_0_16px_var(--color-accent-glow)]"
    : "ring-2 ring-app-accent shadow-[0_0_12px_var(--color-accent-glow)]";

  if (placeholder || !line) {
    return (
      <div className={`flex ${emphasized ? "w-28" : compact ? "w-20" : "w-24"} justify-center gap-1 ${emphasized ? "opacity-40" : "opacity-25"}`}>
        <div className={`${barH} ${yangW} rounded-sm border-2 border-dashed border-app-gold/70 bg-app-gold/5`} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${emphasized ? "w-28" : compact ? "w-20" : "w-24"} items-center justify-center ${yinGap} ${
        highlighted ? "animate-liuyao-yao-glow" : ""
      }`}
    >
      {line.isYang ? (
        <div className={`${barH} ${yangW} ${barSolid} ${line.isChanging ? barChanging : ""}`} />
      ) : (
        <>
          <div className={`${barH} ${yinW} ${barSolid} ${line.isChanging ? barChanging : ""}`} />
          <div className={`${barH} ${yinW} ${barSolid} ${line.isChanging ? barChanging : ""}`} />
        </>
      )}
      {line.isChanging && (
        <span className={`animate-liuyao-mark-pop font-bold text-app-accent ${emphasized ? "text-xs" : "text-[9px]"}`}>
          {line.isYang ? "○" : "×"}
        </span>
      )}
    </div>
  );
}

const YAO_LABEL_STYLE: Record<string, string> = {
  老阳: "text-red-400 bg-red-500/15 border-red-400/40",
  老阴: "text-emerald-400 bg-emerald-500/15 border-emerald-400/40",
  少阳: "text-amber-300 bg-amber-500/15 border-amber-400/40",
  少阴: "text-sky-300 bg-sky-500/15 border-sky-400/40",
};

export default function HexagramLines({
  lines,
  compact,
  title,
  subtitle,
  showPlaceholder,
  totalLines = 6,
  emphasized = false,
  incomingLine = null,
  incomingLineIndex = null,
  flyActive = false,
  highlightLineIndex = null,
}: HexagramLinesProps) {
  const slots: (Line | undefined)[] = showPlaceholder
    ? Array.from({ length: totalLines }, (_, i) => {
        if (lines[i]) return lines[i];
        if (incomingLineIndex === i && incomingLine) return incomingLine;
        return undefined;
      })
    : [...lines];

  const display = showPlaceholder ? [...slots].reverse() : [...lines].reverse();
  const displayPlaceholders = showPlaceholder;

  return (
    <div className={`relative flex flex-col items-center overflow-visible ${emphasized ? "gap-3 py-4" : compact ? "gap-1.5 py-3" : "gap-2 py-4"}`}>
      {display.map((line, i) => {
        const posFromBottom = displayPlaceholders ? totalLines - i : 6 - i;
        const lineIndexFromBottom = posFromBottom - 1;
        const isIncomingSlot = incomingLineIndex === lineIndexFromBottom && !!incomingLine;
        const isFlyingIn = isIncomingSlot && flyActive;
        const isPlaceholder = displayPlaceholders && !line && !isIncomingSlot;
        const highlighted = highlightLineIndex === lineIndexFromBottom;
        const labelClass = line?.label ? YAO_LABEL_STYLE[line.label] ?? "text-app-muted bg-app-bg border-app-border" : "";

        return (
          <div
            key={`yao-${lineIndexFromBottom}-${line?.label ?? "empty"}-${isFlyingIn ? "fly" : "static"}`}
            className={`flex items-center ${emphasized ? "gap-3" : compact ? "gap-2" : "gap-3"} ${
              isFlyingIn
                ? "animate-liuyao-yao-fly-in z-10"
                : highlighted
                  ? "animate-liuyao-yao-landed"
                  : ""
            }`}
          >
            <span className={`${emphasized ? "w-8 text-[11px]" : compact ? "w-6 text-[9px]" : "w-8 text-[10px]"} text-right font-medium ${highlighted || isFlyingIn ? "font-bold text-app-gold" : "text-app-muted"}`}>
              {posFromBottom}爻
            </span>
            <YaoBar
              line={isPlaceholder ? undefined : line}
              compact={compact}
              emphasized={emphasized}
              placeholder={isPlaceholder}
              highlighted={highlighted || isFlyingIn}
            />
            {line?.label && (
              <span
                className={`${compact ? "min-w-[2.5rem] px-1 py-0.5 text-[9px]" : "min-w-[3rem] px-1.5 py-0.5 text-[10px]"} rounded-full border text-center font-medium ${labelClass} ${
                  isFlyingIn || highlighted ? "animate-liuyao-label-pop" : ""
                }`}
              >
                {line.label}
              </span>
            )}
            {isPlaceholder && (
              <span className={`${compact ? "w-10 text-[9px]" : "w-12 text-[10px]"} text-transparent`}>—</span>
            )}
          </div>
        );
      })}
      {title && <p className={`mt-2 font-bold text-app-gold ${compact ? "text-sm" : "text-lg"}`}>{title}</p>}
      {subtitle && <p className="text-xs text-app-muted">{subtitle}</p>}
    </div>
  );
}
