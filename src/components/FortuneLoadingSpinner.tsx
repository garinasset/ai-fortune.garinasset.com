"use client";

interface FortuneLoadingSpinnerProps {
  title?: string;
  message?: string;
  icon?: string;
  /** 紧凑模式：更小图标，适合嵌入图表区域 */
  compact?: boolean;
}

export default function FortuneLoadingSpinner({
  title,
  message,
  icon = "☯",
  compact = false,
}: FortuneLoadingSpinnerProps) {
  const ringSize = compact ? "h-16 w-16" : "h-24 w-24";
  const iconSize = compact ? "text-2xl" : "text-3xl";

  return (
    <div className="flex flex-col items-center px-4 py-6">
      <div className="relative mb-4">
        <div
          className={`${ringSize} animate-pulse rounded-full border-2 border-app-gold/50`}
          style={{ boxShadow: "0 0 24px rgba(212,165,116,0.25)" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${iconSize} text-app-gold`}>{icon}</span>
        </div>
        <div
          className="absolute inset-0 animate-spin rounded-full border-t-2 border-app-accent"
          style={{ animationDuration: "3s" }}
        />
      </div>

      {title && (
        <h3 className={`mb-1 font-semibold text-app-text ${compact ? "text-sm" : "text-lg"}`}>
          {title}
        </h3>
      )}
      {message && (
        <p className={`text-center text-app-gold ${compact ? "text-xs" : "text-sm"}`}>{message}</p>
      )}
    </div>
  );
}
