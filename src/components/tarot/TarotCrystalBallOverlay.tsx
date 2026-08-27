"use client";

import { useEffect, useRef, useState } from "react";

export const TAROT_LOADING_STEPS = [
  "占卜师正在感应",
  "正在进行能量纠缠",
  "观察与倾听大数据",
  "正在感应神圣启示",
  "解读观察者效应",
  "AI解读量子纠缠",
];

interface TarotCrystalBallOverlayProps {
  taskReady?: boolean;
  onComplete?: () => void;
  embedded?: boolean;
  resetKey?: string | number;
}

export default function TarotCrystalBallOverlay({
  taskReady,
  onComplete,
  embedded = false,
  resetKey,
}: TarotCrystalBallOverlayProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    setStep(0);
    setProgress(0);
  }, [resetKey]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((s) => (s + 1) % TAROT_LOADING_STEPS.length);
    }, 1600);
    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (taskReady) return Math.min(p + 2, 100);
        return Math.min(p + 0.25, 92);
      });
    }, 80);
    return () => clearInterval(progressInterval);
  }, [taskReady]);

  useEffect(() => {
    if (!taskReady || completedRef.current) return;
    completedRef.current = true;
    setProgress(100);
    const t = window.setTimeout(() => onComplete?.(), 500);
    return () => window.clearTimeout(t);
  }, [taskReady, onComplete]);

  return (
    <div
      className={
        embedded
          ? "relative flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[#1a0f2e]/98 via-[#0d0818]/99 to-[#0a0612]/98 px-6 py-10"
          : "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0612]/95 backdrop-blur-md"
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(167,139,250,0.12),transparent_65%)]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* 水晶球 */}
        <div className="relative mb-8 h-28 w-28">
          <div
            className="absolute inset-0 animate-spin rounded-full opacity-40"
            style={{
              animationDuration: "8s",
              background: "conic-gradient(from 0deg, transparent, rgba(167,139,250,0.5), transparent, rgba(212,175,106,0.4), transparent)",
            }}
          />
          <div className="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-violet-300/30 via-indigo-400/20 to-purple-600/30 shadow-[0_0_40px_rgba(139,92,246,0.45),inset_0_-8px_20px_rgba(255,255,255,0.15)]" />
          <div className="absolute inset-4 overflow-hidden rounded-full bg-gradient-to-b from-[#c4b5fd]/25 via-[#8b5cf6]/15 to-[#4c1d95]/30">
            <div
              className="absolute inset-0 animate-spin opacity-60"
              style={{
                animationDuration: "4s",
                background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5), transparent 45%), radial-gradient(circle at 70% 75%, rgba(167,139,250,0.4), transparent 50%)",
              }}
            />
            <div className="absolute left-[22%] top-[18%] h-4 w-6 rotate-[-25deg] rounded-full bg-white/35 blur-[2px]" />
          </div>
          <div className="absolute -bottom-3 left-1/2 h-3 w-10 -translate-x-1/2 rounded-b-lg bg-gradient-to-b from-[#6b5b8a] to-[#3d3455]" />
        </div>

        <h2 className="mb-2 text-base font-semibold text-violet-100">AI 解读牌阵</h2>
        <p className="mb-6 min-h-5 text-sm text-app-gold transition-all duration-500">
          {TAROT_LOADING_STEPS[step]}…
        </p>

        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-violet-900/50">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7c3aed, #a78bfa, #d4a574)",
            }}
          />
        </div>
        <p className="mt-2 text-xs text-violet-400/70">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
