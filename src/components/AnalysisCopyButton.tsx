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
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-md border border-app-gold/35 bg-app-gold/12 px-1.5 py-0.5 text-[10px] font-medium text-app-gold transition-colors hover:border-app-gold hover:bg-app-gold/20 ${className}`}
      aria-label="复制解读文字"
    >
      {copied ? <Check className="h-2.5 w-2.5 text-app-gold" /> : <Copy className="h-2.5 w-2.5" />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}
