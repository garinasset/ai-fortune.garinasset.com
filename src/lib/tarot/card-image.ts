/** 塔罗牌面图片路径 — 将图片放入 public/tarot/ 即可自动替换 SVG 插画 */

export function getTarotCardImageSrc(cardId: string): string {
  return `/tarot/${cardId}.webp`;
}

export const TAROT_IMAGE_DIR = "/tarot";
