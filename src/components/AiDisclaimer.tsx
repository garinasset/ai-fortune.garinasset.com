/** 测算结果底部娱乐免责声明 */
export default function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-[10px] leading-relaxed text-app-muted/80 ${className}`}>
      该测算基于国内顶级 AI 大模型推演生成，仅供娱乐！
    </p>
  );
}
