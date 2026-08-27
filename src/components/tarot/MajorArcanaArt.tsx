"use client";

/** 大阿卡纳原创 SVG 人物/场景剪影（韦特系意象，非版权图复刻） */

function Figure({ accent, children }: { accent: string; children: React.ReactNode }) {
  return <g fill={accent} opacity="0.75">{children}</g>;
}

export function MajorArcanaScene({ number, accent }: { number: number; accent: string }) {
  const scenes: Record<number, JSX.Element> = {
    0: (
      <Figure accent={accent}>
        <circle cx="60" cy="48" r="8" /><path d="M52 56 L68 56 L64 92 L56 92 Z" />
        <path d="M38 110 Q60 98 82 110" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4" />
      </Figure>
    ),
    1: (
      <Figure accent={accent}>
        <circle cx="60" cy="40" r="8" /><path d="M50 48 L70 48 L66 88 L54 88 Z" />
        <line x1="40" y1="58" x2="40" y2="102" stroke={accent} strokeWidth="2" /><line x1="80" y1="58" x2="80" y2="102" stroke={accent} strokeWidth="2" />
      </Figure>
    ),
    2: (
      <Figure accent={accent}>
        <circle cx="60" cy="38" r="8" /><path d="M52 46 L68 46 L64 90 L56 90 Z" />
        <text x="60" y="72" textAnchor="middle" fontSize="16" opacity="0.55">☽</text>
      </Figure>
    ),
    3: (
      <Figure accent={accent}>
        <circle cx="60" cy="36" r="9" /><path d="M48 45 Q60 52 72 45 L68 92 L52 92 Z" />
        <ellipse cx="60" cy="105" rx="18" ry="5" opacity="0.25" />
      </Figure>
    ),
    4: (
      <Figure accent={accent}>
        <rect x="40" y="68" width="40" height="32" rx="2" opacity="0.3" />
        <circle cx="60" cy="40" r="9" /><path d="M50 49 L70 49 L67 86 L53 86 Z" />
      </Figure>
    ),
    5: (
      <Figure accent={accent}>
        <circle cx="60" cy="36" r="8" /><path d="M52 44 L68 44 L65 88 L55 88 Z" />
        <path d="M44 54 L76 54" stroke={accent} strokeWidth="2" opacity="0.35" />
      </Figure>
    ),
    6: (
      <Figure accent={accent}>
        <circle cx="48" cy="44" r="7" /><circle cx="72" cy="44" r="7" />
        <path d="M44 51 L52 82 L56 82 L48 51 Z" /><path d="M76 51 L68 82 L64 82 L72 51 Z" />
      </Figure>
    ),
    7: (
      <Figure accent={accent}>
        <rect x="36" y="72" width="48" height="20" rx="3" opacity="0.3" />
        <circle cx="52" cy="46" r="7" /><circle cx="68" cy="46" r="7" />
        <path d="M46 53 L58 53 L55 72 L49 72 Z" /><path d="M62 53 L74 53 L71 72 L65 72 Z" />
      </Figure>
    ),
    8: (
      <Figure accent={accent}>
        <circle cx="60" cy="40" r="8" /><path d="M52 48 L68 48 L64 88 L56 88 Z" />
        <ellipse cx="42" cy="88" rx="10" ry="6" opacity="0.35" /><circle cx="42" cy="82" r="4" opacity="0.4" />
      </Figure>
    ),
    9: (
      <Figure accent={accent}>
        <circle cx="60" cy="42" r="8" /><path d="M52 50 L68 50 L65 88 L55 88 Z" />
        <line x1="60" y1="30" x2="60" y2="22" stroke={accent} strokeWidth="2" />
        <circle cx="60" cy="20" r="4" opacity="0.5" />
      </Figure>
    ),
    10: (
      <Figure accent={accent}>
        <circle cx="60" cy="60" r="22" fill="none" stroke={accent} strokeWidth="2" opacity="0.45" />
        <circle cx="60" cy="60" r="14" fill="none" stroke={accent} strokeWidth="1" opacity="0.3" />
        <circle cx="60" cy="38" r="5" /><circle cx="78" cy="60" r="5" /><circle cx="60" cy="82" r="5" /><circle cx="42" cy="60" r="5" />
      </Figure>
    ),
    11: (
      <Figure accent={accent}>
        <circle cx="60" cy="38" r="8" /><path d="M52 46 L68 46 L64 88 L56 88 Z" />
        <line x1="42" y1="70" x2="78" y2="70" stroke={accent} strokeWidth="2" />
        <path d="M48 70 L48 95 L72 95 L72 70" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4" />
      </Figure>
    ),
    12: (
      <Figure accent={accent}>
        <circle cx="60" cy="55" r="8" /><path d="M52 63 L68 63 L64 95 L56 95 Z" />
        <line x1="60" y1="40" x2="60" y2="55" stroke={accent} strokeWidth="2" />
        <rect x="52" y="38" width="16" height="4" rx="1" opacity="0.4" />
      </Figure>
    ),
    13: (
      <Figure accent={accent}>
        <circle cx="60" cy="38" r="8" /><path d="M52 46 L68 46 L64 88 L56 88 Z" />
        <path d="M48 58 L72 58 L60 78 Z" opacity="0.35" />
        <circle cx="75" cy="105" r="6" opacity="0.3" />
      </Figure>
    ),
    14: (
      <Figure accent={accent}>
        <circle cx="48" cy="42" r="7" /><circle cx="72" cy="42" r="7" />
        <path d="M55 50 L65 50 L62 88 L58 88 Z" />
        <path d="M52 70 L68 70 L60 95 Z" opacity="0.4" />
      </Figure>
    ),
    15: (
      <Figure accent={accent}>
        <circle cx="60" cy="36" r="9" /><path d="M48 45 L72 45 L68 88 L52 88 Z" />
        <path d="M50 55 L70 55 L70 62 L50 62 Z" opacity="0.35" />
        <line x1="48" y1="70" x2="72" y2="70" stroke={accent} strokeWidth="1" opacity="0.4" />
      </Figure>
    ),
    16: (
      <Figure accent={accent}>
        <rect x="48" y="45" width="24" height="45" rx="2" opacity="0.35" />
        <path d="M55 35 L65 35 L60 25 Z" opacity="0.5" />
        <line x1="38" y1="55" x2="82" y2="75" stroke={accent} strokeWidth="2" opacity="0.5" />
      </Figure>
    ),
    17: (
      <Figure accent={accent}>
        <circle cx="60" cy="42" r="10" opacity="0.4" />
        {[0, 72, 144, 216, 288].map((deg) => (
          <circle key={deg} cx={60 + 18 * Math.cos((deg * Math.PI) / 180)} cy={55 + 18 * Math.sin((deg * Math.PI) / 180)} r="2.5" />
        ))}
        <path d="M52 75 L68 75 L64 95 L56 95 Z" opacity="0.45" />
      </Figure>
    ),
    18: (
      <Figure accent={accent}>
        <circle cx="60" cy="38" r="14" opacity="0.35" />
        <path d="M48 55 Q60 48 72 55 L68 92 L52 92 Z" opacity="0.5" />
        <path d="M35 105 Q60 95 85 105" fill="none" stroke={accent} strokeWidth="1" opacity="0.3" />
      </Figure>
    ),
    19: (
      <Figure accent={accent}>
        <circle cx="60" cy="38" r="16" opacity="0.35" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line key={deg} x1="60" y1="38" x2={60 + 20 * Math.cos((deg * Math.PI) / 180)} y2={38 + 20 * Math.sin((deg * Math.PI) / 180)} stroke={accent} strokeWidth="1" opacity="0.3" />
        ))}
        <path d="M52 58 L68 58 L64 92 L56 92 Z" opacity="0.5" />
      </Figure>
    ),
    20: (
      <Figure accent={accent}>
        <circle cx="60" cy="38" r="8" /><path d="M52 46 L68 46 L64 88 L56 88 Z" />
        <path d="M45 55 L75 55" stroke={accent} strokeWidth="2" opacity="0.3" />
      </Figure>
    ),
    21: (
      <Figure accent={accent}>
        <circle cx="60" cy="42" r="8" /><path d="M52 50 L68 50 L64 88 L56 88 Z" />
        <ellipse cx="60" cy="105" rx="22" ry="6" opacity="0.25" />
        <path d="M38 105 Q60 88 82 105" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.35" />
      </Figure>
    ),
  };

  return scenes[number] ?? (
    <Figure accent={accent}>
      <circle cx="60" cy="55" r="20" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4" />
      <text x="60" y="62" textAnchor="middle" fontSize="24" opacity="0.6">✦</text>
    </Figure>
  );
}
