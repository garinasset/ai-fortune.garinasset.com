"use client";

import { useEffect, useState } from "react";
import { splitAnalysisParagraphs } from "@/lib/format-analysis-text";

interface TypewriterTextProps {
  text: string;
  className?: string;
  /** 每个字符间隔（毫秒） */
  charDelay?: number;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  className = "text-xs leading-relaxed text-app-muted whitespace-pre-wrap",
  charDelay = 18,
  onComplete,
}: TypewriterTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const fullText = text ?? "";

  useEffect(() => {
    setVisibleCount(0);
  }, [fullText]);

  useEffect(() => {
    if (visibleCount >= fullText.length) {
      onComplete?.();
      return;
    }
    const timer = window.setTimeout(() => {
      setVisibleCount((c) => Math.min(c + 1, fullText.length));
    }, charDelay);
    return () => window.clearTimeout(timer);
  }, [visibleCount, fullText, charDelay, onComplete]);

  const shown = fullText.slice(0, visibleCount);
  const paragraphs = splitAnalysisParagraphs(shown);
  const typing = visibleCount < fullText.length;

  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? "mt-2" : undefined}>
          {p}
          {typing && i === paragraphs.length - 1 && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-app-accent align-middle" />
          )}
        </p>
      ))}
      {typing && paragraphs.length === 0 && (
        <span className="inline-block h-3.5 w-0.5 animate-pulse bg-app-accent" />
      )}
    </div>
  );
}
