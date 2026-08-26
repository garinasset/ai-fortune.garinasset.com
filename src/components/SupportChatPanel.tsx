"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X, Headphones, Copy, Check, ChevronLeft } from "lucide-react";
import TypewriterText from "@/components/TypewriterText";
import {
  SUPPORT_QUICK_PROMPTS,
  SUPPORT_WELCOME,
  getSupportReply,
} from "@/lib/support-faq";

const WECHAT_ID = "Holt710";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  animate?: boolean;
}

interface SupportChatPanelProps {
  onClose: () => void;
}

export default function SupportChatPanel({ onClose }: SupportChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "agent", text: SUPPORT_WELCOME },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHuman, setShowHuman] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading, showHuman]);

  const sendMessage = useCallback((q: string) => {
    const text = q.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setDraft("");
    setLoading(true);

    window.setTimeout(() => {
      const reply = getSupportReply(text);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "agent", text: reply, animate: true },
      ]);
      setLoading(false);
    }, 400);
  }, [loading]);

  const copyWechat = () => {
    navigator.clipboard.writeText(WECHAT_ID);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (showHuman) {
    return (
      <div className="relative flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-app-border px-3 py-2.5">
          <button
            type="button"
            onClick={() => setShowHuman(false)}
            className="rounded-lg p-1 text-app-muted hover:text-app-text"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-app-text">人工客服</p>
            <p className="text-[10px] text-app-muted">添加微信，获取帮助与反馈</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-app-muted hover:text-app-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-app-border bg-app-bg p-4 text-center">
            <p className="mb-1 text-xs text-app-muted">客服微信</p>
            <p className="text-xl font-bold tracking-wider text-app-gold">{WECHAT_ID}</p>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-app-muted">
            工作时间请简要描述问题与截图，我们会尽快回复。
          </p>
          <button
            type="button"
            onClick={copyWechat}
            className="app-btn mt-4 flex w-full items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "点击复制微信号"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-app-border px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-accent/15 text-lg">
          🤖
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-app-text">AI 客服</p>
          <p className="text-[10px] text-app-muted">功能咨询 · 使用指引 · 7×24 在线</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-app-muted hover:text-app-text">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={messagesRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        style={{ maxHeight: "min(52vh, 420px)" }}
      >
        {messages.map((m) => {
          const mine = m.role === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <span className="mr-1.5 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-accent/15 text-xs">
                  🤖
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  mine
                    ? "rounded-br-md bg-app-accent text-white"
                    : "rounded-bl-md border border-app-border bg-app-bg text-app-text"
                }`}
              >
                {mine ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : m.animate ? (
                  <TypewriterText text={m.text} className="whitespace-pre-wrap text-xs leading-relaxed text-app-text" />
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <span className="mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-accent/15 text-xs">
              🤖
            </span>
            <div className="animate-pulse rounded-2xl rounded-bl-md border border-app-border bg-app-bg px-3 py-2 text-xs text-app-muted">
              正在输入…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-app-border p-3">
        <div className="flex gap-2">
          <input
            className="app-input flex-1 !py-2 text-xs"
            placeholder="描述您想了解的功能…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(draft)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => sendMessage(draft)}
            disabled={loading || !draft.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-accent text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="caption mb-1.5 mt-3 text-app-muted">常见问题</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SUPPORT_QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="rounded-full border border-app-border px-2.5 py-1 text-[10px] text-app-muted transition-colors hover:border-app-accent hover:text-app-accent disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowHuman(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-gold/35 bg-app-gold/10 py-2 text-xs font-medium text-app-gold transition-colors hover:bg-app-gold/15"
        >
          <Headphones className="h-3.5 w-3.5" />
          转人工客服
        </button>
      </div>
    </div>
  );
}
