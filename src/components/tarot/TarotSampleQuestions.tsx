"use client";

const SAMPLE_QUESTIONS = [
  "2026年我的桃花运如何？",
  "Ta 对我到底是什么感觉？",
  "我该留在现在的工作，还是离开？",
  "接下来三个月我的财运如何？",
];

interface TarotSampleQuestionsProps {
  onPick: (q: string) => void;
}

export default function TarotSampleQuestions({ onPick }: TarotSampleQuestionsProps) {
  return (
    <div className="mt-3 border-t border-app-border/50 pt-3">
      <p className="mb-2 text-[11px] font-medium text-app-text">试试这些问题</p>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-full border border-app-border bg-app-bg/60 px-2.5 py-1 text-[10px] text-app-text transition-colors hover:border-app-gold/45 hover:bg-app-gold/10 hover:text-app-gold"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
