export const PET_FOOD_UPDATED_EVENT = "pet-food-updated";

export function notifyPetFoodUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PET_FOOD_UPDATED_EVENT));
  }
}

/** 共享灵丹池剩余次数文案（1 瓶灵丹 = 5 次，各功能共用） */
export function formatPetFoodRemaining(count: number): string {
  if (count >= 999) return "灵丹无限";
  return `剩余灵丹 ${count} 次`;
}
