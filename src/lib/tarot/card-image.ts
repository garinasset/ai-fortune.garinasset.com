/** 塔罗牌面图片路径 — public/tarot/{id}.jpg（Wikimedia RWS1909 公有领域） */

export function getTarotCardImageSrc(cardId: string): string {
  return `/tarot/${cardId}.jpg`;
}

export const TAROT_IMAGE_DIR = "/tarot";
