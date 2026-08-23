"use client";

import { useState, useEffect } from "react";
import GenerationOverlay from "@/components/GenerationOverlay";
import ReportPosterButton, { SharePosterButton } from "@/components/ReportPosterButton";
import PaywallModal from "@/components/PaywallModal";
import HexagramLines from "@/components/HexagramLines";
import { castHexagram, type HexagramResult } from "@/lib/liuyao";
import { canUse, incrementUsage } from "@/lib/user-store";
import { usePetFoodRemaining } from "@/hooks/usePetFoodRemaining";
import { formatPetFoodRemaining } from "@/lib/pet-food-remaining";
import { saveRecord, buildPersonKey } from "@/lib/record-store";
import { useApp } from "@/context/AppContext";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import AiDisclaimer from "@/components/AiDisclaimer";
import { ensurePrimaryPersonBeforeCalc } from "@/lib/person-store";
import { grantSpiritPowerForTask } from "@/lib/spirit-pet-tasks";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import PageHeader from "@/components/ui/PageHeader";

export default function LiuyaoPage() {
  const { user } = useApp();
  const [question, setQuestion] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<HexagramResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const remaining = usePetFoodRemaining();

  useEffect(() => {
    const cached = loadSessionResult<{ question: string; result: HexagramResult }>("liuyao");
    if (cached?.result) {
      setQuestion(cached.question);
      setResult(cached.result);
    }
  }, []);

  const handleCast = () => {
    if (!question.trim()) return;
    if (!ensurePrimaryPersonBeforeCalc()) { setPrimaryModal(true); return; }
    if (!canUse("liuyao")) { setPaywall(true); return; }
    setError(null);
    setGenerating(true);
    setResult(null);
  };

  const onComplete = async () => {
    const hex = castHexagram(question);
    try {
      const res = await fetch("/api/liuyao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          guaName: hex.guaName,
          guaDesc: hex.guaDesc,
          lines: hex.lines,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "六爻解读失败");
      const merged: HexagramResult = {
        ...hex,
        luck: data.luck ?? hex.luck,
        analysis: data.analysis ?? hex.analysis,
        advice: data.advice ?? hex.advice,
      };
      setResult(merged);
      incrementUsage("liuyao");
      const personName = user?.nickname ?? "六爻问卦";
      saveRecord({
        type: "liuyao",
        personKey: buildPersonKey(personName),
        personName,
        personLabel: personName,
        title: `${merged.guaName}卦 · ${merged.luck}`,
        summary: merged.advice,
        data: { question, result: merged },
      });
      grantSpiritPowerForTask("liuyao");
      saveSessionResult("liuyao", { question, result: merged });
    } catch (e) {
      setError(e instanceof Error ? e.message : "六爻解读失败，请稍后重试");
      setResult(null);
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return <GenerationOverlay onComplete={onComplete} duration={5000} />;
  }

  return (
    <>
      <PageHeader title="AI 六爻" subtitle={`诚心发问 · 爻卦天机 · ${formatPetFoodRemaining(remaining)}`} />

      {!result ? (
        <>
          <div className="app-card mb-4">
            <label className="app-label">你想问什么？</label>
            <textarea
              className="app-input min-h-[100px] resize-none"
              placeholder="例如：今年事业是否顺利？感情能否有结果？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button onClick={handleCast} disabled={!question.trim()} className="app-btn">
            爻 卦
          </button>
          <p className="mt-3 text-center text-[10px] text-app-muted">
            静心默念所问之事，再点击爻卦
          </p>
          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
        </>
      ) : (
        <>
          <div className="app-card mb-4">
            <p className="mb-1 text-xs text-app-muted">所问</p>
            <p className="text-sm text-app-text">{result.question}</p>
          </div>

          <div className="app-card mb-4">
            <HexagramLines
              lines={result.lines}
              title={`${result.guaName}卦`}
              subtitle={result.guaDesc}
            />
            <div className="text-center">
              <span className={`rounded-full px-3 py-1 text-xs ${
                result.luck === "大吉" || result.luck === "吉" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
              }`}>{result.luck}</span>
            </div>
          </div>
          <AiDisclaimer className="mb-4" />

          <div className="app-card mb-4">
            <h3 className="mb-2 text-sm font-medium">卦象解读</h3>
            <p className="whitespace-pre-line text-xs leading-relaxed text-app-muted">{result.analysis}</p>
            <p className="mt-3 text-xs text-app-gold">💡 {result.advice}</p>
          </div>

          <button onClick={() => { clearSessionResult("liuyao"); setResult(null); setQuestion(""); }}
            className="app-btn mb-4 w-full">再来一卦？</button>

          <ReportPosterButton
            data={{
              title: `${result.guaName}卦 · ${result.luck}`,
              subtitle: result.question.slice(0, 30),
              summary: result.analysis + "\n" + result.advice,
              type: "liuyao",
              hexagramLines: result.lines,
              guaName: result.guaName,
              guaDesc: result.guaDesc,
              luck: result.luck,
            }}
          />
          <SharePosterButton
            data={{
              title: `${result.guaName}卦 · ${result.luck}`,
              summary: result.analysis + "\n" + result.advice,
              type: "liuyao",
              hexagramLines: result.lines,
              guaName: result.guaName,
              guaDesc: result.guaDesc,
              luck: result.luck,
            }}
          />
        </>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="AI六爻" />
      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
    </>
  );
}
