const AUDIO_SRC = "/audio/liuyao-shake.mp3";

export interface LiuyaoSoundHandle {
  stop: () => void;
  /** 音效播放完毕（或出错） */
  done: Promise<void>;
}

/** 摇卦音效 — 使用本地 MP3 */
export function playLiuyaoCoinSound(): LiuyaoSoundHandle {
  if (typeof window === "undefined") {
    return { stop: () => {}, done: Promise.resolve() };
  }

  const audio = new Audio(AUDIO_SRC);
  audio.volume = 0.9;
  audio.preload = "auto";

  const done = new Promise<void>((resolve) => {
    const finish = () => resolve();
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
  });

  void audio.play().catch(() => {
    /* 浏览器自动播放策略拦截时仍继续流程 */
  });

  return {
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
    done,
  };
}

/** 每爻展示停留（飞入后） */
export const LIUYAO_REVEAL_HOLD_MS = 1000;
