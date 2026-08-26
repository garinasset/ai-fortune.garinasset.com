export default function LiuyaoIntro({ compact }: { compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-app-gold/25 bg-app-gold/5 ${compact ? "p-3" : "p-4"}`}>
      <h3 className={`mb-2 font-semibold text-app-gold ${compact ? "text-xs" : "text-sm"}`}>
        什么是六爻？
      </h3>
      <div className={`space-y-2 text-app-muted ${compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed"}`}>
        <p>
          六爻源于《周易》，是传统占卜方法之一。心中有所疑惑时，可通过掷铜钱起卦，借卦象变化为所问之事寻求参考与指引。
        </p>
        <p>
          <span className="font-medium text-app-text">如何起卦：</span>
          静心默念所问之事，以三枚铜钱连掷 <strong className="text-app-gold">六次</strong>，自下而上得六条爻，合成完整卦象后再行解读。
        </p>
        <p>
          <span className="font-medium text-app-text">起卦原理：</span>
          三枚铜钱，字为阴、背为阳——三字为老阴(6)，两字一背为少阳(7)，一字两背为少阴(8)，三背为老阳(9)。老阴、老阳为动爻；六爻齐备，即可据本卦与动爻断事。
        </p>
      </div>
    </div>
  );
}
