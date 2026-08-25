"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { splitAnalysisParagraphs, truncateParagraphs } from "@/lib/format-analysis-text";

interface FormattedAnalysisTextProps {
  text: string;
  className?: string;
  /** 折叠时最多展示几段，0 表示不折叠 */
  collapsedParagraphs?: number;
  expandLabel?: string;
  collapseLabel?: string;
}

export default function FormattedAnalysisText({
  text,
  className = "text-xs leading-relaxed text-app-muted",
  collapsedParagraphs = 2,
  expandLabel = "查看完整分析",
  collapseLabel = "收起分析",
}: FormattedAnalysisTextProps) {
  const paragraphs = useMemo(() => splitAnalysisParagraphs(text), [text]);
  const [expanded, setExpanded] = useState(false);

  const canCollapse = collapsedParagraphs > 0 && paragraphs.length > collapsedParagraphs;
  const visible = expanded || !canCollapse
    ? paragraphs
    : truncateParagraphs(paragraphs, collapsedParagraphs);

  if (!paragraphs.length) return null;

  return (
    <div>
      <div className={className}>
        {visible.map((p, i) => (
          <p key={i} className={i > 0 ? "mt-2.5" : undefined}>
            {p}
          </p>
        ))}
      </div>
      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-app-accent"
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
