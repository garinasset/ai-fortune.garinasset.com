"use client";

import { useEffect, useRef, useState } from "react";

export const GENERATION_LOADING_STEPS = [
  "正在连接命理推演引擎...",
  "解析天干地支四柱...",
  "计算流年大运走势...",
  "生成人生 K 线数据...",
  "AI大模型正在推演...",
  "AI大数据返回接收...",
  "大师正在深度测算...",
  "推演五行格局能量...",
  "绘制命势可视化图表...",
  "生成综合命理报告...",
];

const DEFAULT_STEPS = GENERATION_LOADING_STEPS;

interface GenerationOverlayProps {
  onComplete?: () => void;
  duration?: number;
  title?: string;
  message?: string;
  subMessage?: string;
  steps?: string[];
  icon?: string;
  /** 嵌入面板内，不遮挡顶部导航 */
  embedded?: boolean;
  /** 传入后与真实任务同步：完成前进度最高约 92%，taskReady 为 true 后再到 100% */
  taskReady?: boolean;
  /** sync 模式下最短展示时长（毫秒），避免 AI 返回过快时动画一闪而过 */
  minDuration?: number;
  /** sync 模式下等待 AI 时进度条上限（0-100） */
  waitingCap?: number;
  /** 变化时重置进度与文案（新一轮生成） */
  resetKey?: string | number;
}

export default function GenerationOverlay({
  onComplete,
  duration = 6000,
  title = "大师正在测算",
  message,
  subMessage,
  steps = DEFAULT_STEPS,
  icon = "☯",
  embedded = false,
  taskReady,
  minDuration = 0,
  waitingCap = 95,
  resetKey,
}: GenerationOverlayProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const syncMode = taskReady !== undefined;
  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);

  useEffect(() => {
    startedAtRef.current = Date.now();
    completedRef.current = false;
    setStep(0);
    setProgress(0);
  }, [resetKey, title]);

  useEffect(() => {
    if (taskReady) return;
    completedRef.current = false;
    setProgress((p) => (p >= waitingCap ? 0 : p));
  }, [taskReady, waitingCap]);

  useEffect(() => {
    if (syncMode) {
      const stepInterval = setInterval(() => {
        setStep((s) => (s + 1) % steps.length);
      }, 1000);

      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (taskReady) return p;
          return Math.min(p + 0.28, waitingCap);
        });
      }, 100);

      return () => {
        clearInterval(stepInterval);
        clearInterval(progressInterval);
      };
    }

    const stepInterval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, duration / steps.length);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 100));
    }, duration / 100);

    const timer = onComplete ? setTimeout(onComplete, duration) : undefined;

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      if (timer) clearTimeout(timer);
    };
  }, [duration, onComplete, steps.length, syncMode, taskReady, waitingCap]);

  useEffect(() => {
    if (!syncMode || !taskReady || completedRef.current) return;
    completedRef.current = true;
    setProgress(100);
    const timer = window.setTimeout(() => onComplete?.(), 400);
    return () => window.clearTimeout(timer);
  }, [syncMode, taskReady, onComplete]);

  const stepText = message ?? steps[step];

  return (
    <div className={
      embedded
        ? "absolute inset-0 z-30 flex min-h-[280px] flex-col items-center justify-center rounded-xl bg-app-bg/95 backdrop-blur-md"
        : "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg/95 backdrop-blur-md"
    }>
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(212,165,116,0.15), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-8">
        <div className="relative mb-8">
          <div className="h-24 w-24 animate-pulse rounded-full border-2 border-app-gold/50"
            style={{ boxShadow: "0 0 24px rgba(212,165,116,0.25)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl text-app-gold">{icon}</span>
          </div>
          <div className="absolute inset-0 animate-spin rounded-full border-t-2 border-app-accent"
            style={{ animationDuration: "3s" }}
          />
        </div>

        <h2 className="mb-2 text-lg font-semibold text-app-text">{title}</h2>
        <p className="mb-1 min-h-5 text-sm text-app-gold transition-all duration-300">{stepText}</p>
        {subMessage && <p className="mb-6 text-xs text-app-muted">{subMessage}</p>}
        {!subMessage && <div className="mb-6" />}

        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-app-border">
          <div
            className="h-full rounded-full transition-all duration-150 ease-linear"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #c45c48, #d4a574, #5a8a7a)",
            }}
          />
        </div>
        <p className="mt-2 text-xs text-app-muted">{Math.round(progress)}%</p>

        <div className="mt-8 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-1 rounded-full bg-app-gold/60"
              style={{
                animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                opacity: 0.3 + (i * 0.15),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
