/** 塔罗声效 — Web Audio API 程序化生成，无需外部音频文件 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function noiseBurst(ctx: AudioContext, duration: number, volume: number, filterFreq: number) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

function tone(ctx: AudioContext, freq: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export interface TarotSoundHandle {
  stop: () => void;
}

/** 洗牌声效 — 循环播放直到 stop */
export function playTarotShuffleSound(): TarotSoundHandle {
  const ctx = getCtx();
  if (!ctx) return { stop: () => {} };

  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const burst = () => {
    if (stopped) return;
    noiseBurst(ctx, 0.12 + Math.random() * 0.08, 0.18 + Math.random() * 0.06, 800 + Math.random() * 400);
    tone(ctx, 120 + Math.random() * 60, 0.06, 0.04, "triangle");
  };

  burst();
  timer = setInterval(burst, 180);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearInterval(timer);
    },
  };
}

/** 抽牌声效 */
export function playTarotPickSound() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, 440, 0.08, 0.12, "sine");
  tone(ctx, 660, 0.1, 0.08, "sine");
  noiseBurst(ctx, 0.05, 0.06, 2000);
}

/** 牌面展示声效 — 明亮上扬 */
export function playTarotRevealSound() {
  const ctx = getCtx();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    window.setTimeout(() => tone(ctx!, freq, 0.35, 0.1, "sine"), i * 80);
  });
  tone(ctx, 1318, 0.5, 0.06, "triangle");
}
