"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import AnalysisCopyButton from "@/components/AnalysisCopyButton";
import {
  formatAnalysisForCopy,
  parseAnalysisSegments,
  splitAnalysisParagraphs,
  truncateParagraphs,
  type AnalysisSegment,
} from "@/lib/format-analysis-text";

interface FormattedAnalysisTextProps {
  text: string;
  className?: string;
  /** 折叠时最多展示几段，0 表示不折叠 */
  collapsedParagraphs?: number;
  expandLabel?: string;
  collapseLabel?: string;
  /** 是否显示复制按钮 */
  copyable?: boolean;
  /** 紧凑模式（用于维度卡片等小区域） */
  compact?: boolean;
}

function HighlightedLine({ text }: { text: string }) {
  const parts = text.split(/(【[^】]+】|「[^」]+」|宜[^，。；\n]{1,16}|忌[^，。；\n]{1,16}|大吉|大凶|\d+分)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (/^【/.test(part) || /^「/.test(part)) {
          return (
            <strong key={i} className="font-semibold text-app-gold">
              {part}
            </strong>
          );
        }
        if (/^(宜|忌)/.test(part) || /^(大吉|大凶)$/.test(part) || /\d+分/.test(part)) {
          return (
            <span key={i} className="font-semibold text-app-accent">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SegmentBlock({ segment, compact }: { segment: AnalysisSegment; compact?: boolean }) {
  switch (segment.type) {
    case "lead":
      return (
        <p className={`font-medium text-app-text ${compact ? "text-[13px] leading-[1.7]" : "text-[15px] leading-[1.85]"}`}>
          <HighlightedLine text={segment.text} />
        </p>
      );
    case "heading":
      return (
        <p className={`font-semibold text-app-gold ${compact ? "text-xs" : "text-sm"}`}>
          {segment.text}
        </p>
      );
    case "tip":
      return (
        <div className={`rounded-lg border border-app-gold/25 bg-app-gold/10 px-3 py-2.5 ${compact ? "text-xs" : "text-[13px]"} leading-relaxed text-app-gold`}>
          <span className="mr-1">💡</span>
          <HighlightedLine text={segment.text} />
        </div>
      );
    case "bullets":
      return (
        <ul className={`space-y-1.5 pl-1 ${compact ? "text-xs" : "text-[13px]"} leading-relaxed text-app-text/90`}>
          {segment.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent/70" />
              <span><HighlightedLine text={item} /></span>
            </li>
          ))}
        </ul>
      );
    case "paragraph":
    default:
      return (
        <p className={`leading-[1.75] text-app-text/90 ${compact ? "text-xs" : "text-[13px]"}`}>
          <HighlightedLine text={segment.text} />
        </p>
      );
  }
}

export default function FormattedAnalysisText({
  text,
  className = "",
  collapsedParagraphs = 2,
  expandLabel = "查看完整分析",
  collapseLabel = "收起分析",
  copyable = true,
  compact = false,
}: FormattedAnalysisTextProps) {
  const paragraphs = useMemo(() => splitAnalysisParagraphs(text), [text]);
  const [expanded, setExpanded] = useState(false);

  const canCollapse = collapsedParagraphs > 0 && paragraphs.length > collapsedParagraphs;
  const visibleParagraphs = expanded || !canCollapse
    ? paragraphs
    : truncateParagraphs(paragraphs, collapsedParagraphs);

  const visibleText = visibleParagraphs.join("\n\n");
  const segments = useMemo(() => parseAnalysisSegments(visibleText), [visibleText]);
  const copyText = formatAnalysisForCopy(expanded || !canCollapse ? text : visibleText);

  if (!paragraphs.length) return null;

  return (
    <div className={`relative rounded-xl border border-app-border/70 bg-app-bg/45 ${compact ? "px-3 py-2.5" : "px-3.5 py-3.5"} ${className}`}>
      {copyable && (
        <div className="absolute right-2 top-2 z-[1]">
          <AnalysisCopyButton text={copyText} />
        </div>
      )}

      <div className={`space-y-3 ${copyable ? "pr-14" : ""}`}>
        {segments.map((segment, i) => (
          <SegmentBlock key={i} segment={segment} compact={compact} />
        ))}
      </div>

      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-[11px] font-medium text-app-accent"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {collapseLabel}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {expandLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}
