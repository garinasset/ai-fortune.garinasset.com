"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BirthForm from "@/components/BirthForm";
import GenerationOverlay from "@/components/GenerationOverlay";
import ReportPosterButton, { SharePosterButton } from "@/components/ReportPosterButton";
import PaywallModal from "@/components/PaywallModal";
import HexagramLines from "@/components/HexagramLines";
import { castHexagram, type HexagramResult } from "@/lib/liuyao";
import { canUse, incrementUsage, getRemaining } from "@/lib/user-store";
import { saveRecord, buildPersonKey, buildPersonLabel } from "@/lib/record-store";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import BoostFortuneButton from "@/components/BoostFortuneButton";
import { ensurePrimaryPersonBeforeCalc, getPersonDisplayName } from "@/lib/person-store";
import { grantSpiritPowerForTask } from "@/lib/spirit-pet-tasks";
import { saveSessionResult, loadSessionResult, clearSessionResult } from "@/lib/session-result-cache";
import { saveBirthInfo } from "@/lib/birth-store";
import type { BirthInfo } from "@/lib/types";

interface LiuyaoSessionState {
  question: string;
  birthInfo: BirthInfo;
  result: HexagramResult;
}

export default function LiuyaoHubPanel() {
  const [question, setQuestion] = useState("");
  const [birthDraft, setBirthDraft] = useState<BirthInfo | null>(null);
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateReady, setGenerateReady] = useState(false);
  const [result, setResult] = useState<HexagramResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const resultRef = useRef<LiuyaoSessionState | null>(null);
  const remaining = getRemaining("liuyao");

  useEffect(() => {
    const cached = loadSessionResult<LiuyaoSessionState>("liuyao");
    if (cached?.result && cached.birthInfo) {
      setQuestion(cached.question);
      setBirthInfo(cached.birthInfo);
      setBirthDraft(cached.birthInfo);
      setResult(cached.result);
    }
  }, []);

  const handleCast = () => {
    if (!question.trim()) return;
    if (!birthDraft) {
      setError("请先填写测算对象的生辰信息");
      return;
    }
    if (!ensurePrimaryPersonBeforeCalc()) { setPrimaryModal(true); return; }
    if (!canUse("liuyao")) { setPaywall(true); return; }
    const info = saveBirthInfo(birthDraft);
    setError(null);
    setBirthInfo(info);
    setGenerating(true);
    setGenerateReady(false);
    setResult(null);
    resultRef.current = null;
  };

  useEffect(() => {
    if (!generating || !birthInfo || !question.trim()) return;

    (async () => {
      const hex = castHexagram(question);
      try {
        const res = await fetch("/api/liuyao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            birthInfo,
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
        resultRef.current = { question, birthInfo, result: merged };
        setGenerateReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "六爻解读失败，请稍后重试");
        setGenerating(false);
      }
    })();
  }, [generating, birthInfo, question]);

  const onGenerateComplete = useCallback(() => {
    const pending = resultRef.current;
    if (!pending) return;

    setResult(pending.result);
    incrementUsage("liuyao");
    const personName = getPersonDisplayName(pending.birthInfo, "六爻问卦");
    saveRecord({
      type: "liuyao",
      personKey: buildPersonKey(personName, pending.birthInfo),
      personName,
      personLabel: buildPersonLabel(personName, pending.birthInfo),
      title: `${pending.result.guaName}卦 · ${pending.result.luck}`,
      summary: pending.result.advice,
      data: { question: pending.question, birthInfo: pending.birthInfo, result: pending.result },
    });
    grantSpiritPowerForTask("liuyao");
    saveSessionResult("liuyao", pending);
    setGenerating(false);
  }, []);

  return (
    <div className="relative">
      {generating && (
        <GenerationOverlay embedded taskReady={generateReady} onComplete={onGenerateComplete} title="正在爻卦" icon="☯" />
      )}

      <p className="caption mb-3 text-app-muted">诚心发问 · 爻卦天机 · 剩余免费 {remaining} 次</p>

      {!result ? (
        <>
          <div className="app-card mb-4">
            <p className="subsection-title mb-2">测算对象生辰</p>
            <BirthForm
              onSubmit={() => {}}
              onValuesChange={setBirthDraft}
              hideSubmit
              syncActivePerson={false}
            />
          </div>
          <div className="app-card mb-4">
            <label className="app-label">你想问什么？</label>
            <textarea
              className="app-input min-h-[100px] resize-none"
              placeholder="例如：今年事业是否顺利？感情能否有结果？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button onClick={handleCast} disabled={!question.trim() || !birthDraft} className="app-btn">
            爻 卦
          </button>
          <p className="mt-3 text-center text-[10px] text-app-muted">填写生辰 · 静心默念所问之事 · 再点击爻卦</p>
          {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
        </>
      ) : (
        <>
          {birthInfo && (
            <div className="app-card mb-3">
              <p className="mb-1 text-xs text-app-muted">测算对象</p>
              <p className="text-sm text-app-text">{buildPersonLabel(getPersonDisplayName(birthInfo), birthInfo)}</p>
            </div>
          )}
          <div className="app-card mb-4">
            <p className="mb-1 text-xs text-app-muted">所问</p>
            <p className="text-sm text-app-text">{result.question}</p>
          </div>
          <div className="app-card mb-4">
            <HexagramLines lines={result.lines} title={`${result.guaName}卦`} subtitle={result.guaDesc} />
            <div className="text-center">
              <span className={`rounded-full px-3 py-1 text-xs ${
                result.luck === "大吉" || result.luck === "吉" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
              }`}>{result.luck}</span>
            </div>
          </div>
          <div className="app-card mb-4">
            <h3 className="mb-2 text-sm font-medium">卦象解读</h3>
            <p className="whitespace-pre-line text-xs leading-relaxed text-app-muted">{result.analysis}</p>
            <p className="mt-3 text-xs text-app-gold">💡 {result.advice}</p>
          </div>
          <button onClick={() => { clearSessionResult("liuyao"); setResult(null); setQuestion(""); setBirthInfo(null); }} className="app-btn mb-4 w-full">
            再来一卦？
          </button>
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
          <div className="mt-3">
            <BoostFortuneButton />
          </div>
        </>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} feature="AI六爻" />
      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
    </div>
  );
}
