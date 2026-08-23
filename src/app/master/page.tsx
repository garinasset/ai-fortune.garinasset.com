"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import BirthForm from "@/components/BirthForm";
import { submitMasterConsultWithSave } from "@/lib/submit-master-consult";
import { ensurePrimaryPersonBeforeCalc } from "@/lib/person-store";
import PrimaryPersonModal from "@/components/PrimaryPersonModal";
import MasterPayModal from "@/components/MasterPayModal";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { MASTER_CONSULT_PRICE } from "@/lib/master-pay-store";
import type { BirthInfo } from "@/lib/types";

export default function MasterPage() {
  const { user } = useApp();
  const [name, setName] = useState("");
  const [birthDraft, setBirthDraft] = useState<BirthInfo | null>(null);
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [primaryModal, setPrimaryModal] = useState(false);
  const [payModal, setPayModal] = useState(false);

  const submitConsult = () => {
    if (!name.trim() || !question.trim() || !user || !birthDraft) return;
    submitMasterConsultWithSave({
      userId: user.id,
      name: name.trim(),
      birthInfo: { ...birthDraft, name: name.trim() },
      question: question.trim(),
    });
    setSubmitted(true);
  };

  const handleSubmit = () => {
    if (!name.trim() || !question.trim() || !birthDraft || !user) return;
    if (!ensurePrimaryPersonBeforeCalc()) { setPrimaryModal(true); return; }
    setPayModal(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pb-4">
        <CheckCircle className="mb-4 h-16 w-16 text-app-gold" />
        <h2 className="mb-2 text-lg font-bold text-app-text">提交成功</h2>
        <p className="mb-1 text-center text-sm text-app-muted">大师将在 24 小时之内回复</p>
        <p className="text-center text-xs text-app-muted">请留意左上角「我的 → 消息」通知</p>
        <p className="caption mt-4 text-app-gold">本次咨询 ¥{MASTER_CONSULT_PRICE} · 不占用灵丹次数</p>
        <button onClick={() => setSubmitted(false)} className="app-btn-outline mt-6 max-w-xs">
          再次咨询
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="问真人大师"
        subtitle="资深命理师 · 一对一解答 · 不占用灵丹次数"
      />
      <div className="mb-3 text-center">
        <Badge variant="accent">单次咨询 ¥{MASTER_CONSULT_PRICE}</Badge>
      </div>

      <div className="app-card !p-3 space-y-2">
        <div>
          <label className="mb-0.5 block text-[11px] font-medium text-app-muted">姓名</label>
          <input
            className="w-full rounded-lg border border-app-border bg-app-card px-2.5 py-1.5 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:shadow-[0_0_0_2px_var(--color-accent-glow)]"
            placeholder="请输入您的姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <BirthForm
          onSubmit={() => {}}
          onValuesChange={setBirthDraft}
          hideSubmit
          hideName
          syncActivePerson={false}
        />
        <div>
          <label className="mb-0.5 block text-[11px] font-medium text-app-muted">所问何事？</label>
          <textarea
            className="w-full rounded-lg border border-app-border bg-app-card px-2.5 py-1.5 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:shadow-[0_0_0_2px_var(--color-accent-glow)] min-h-[100px] resize-none"
            placeholder="请详细描述您想咨询的问题，如事业、感情、健康等…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !question.trim() || !birthDraft}
          className="app-btn app-btn-sm mt-1 w-full"
        >
          支付 ¥{MASTER_CONSULT_PRICE} 并提交咨询
        </button>
      </div>

      <p className="mt-3 text-center text-[10px] text-app-muted">
        提交后大师将在 24 小时内回复 · 回复将推送至「消息」
      </p>

      <PrimaryPersonModal open={primaryModal} onClose={() => setPrimaryModal(false)} />
      <MasterPayModal open={payModal} onClose={() => setPayModal(false)} onPaid={submitConsult} />
    </>
  );
}
