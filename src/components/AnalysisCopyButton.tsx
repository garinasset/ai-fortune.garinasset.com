"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface AnalysisCopyButtonProps {
  text: string;
  className?: string;
}

export default function AnalysisCopyButton({ text, className = "" }: AnalysisCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border border-app-border/80 bg-app-card/80 px-2 py-1 text-[10px] font-medium text-app-muted transition-colors hover:border-app-accent/40 hover:text-app-accent ${className}`}
      aria-label="复制解读文字"
    >
      {copied ? <Check className="h-3 w-3 text-app-gold" /> : <Copy className="h-3 w-3" />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}
