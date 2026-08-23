"use client";

import { useEffect, useState } from "react";
import { getRemaining } from "@/lib/user-store";
import { PET_FOOD_UPDATED_EVENT } from "@/lib/pet-food-remaining";

/** 订阅共享灵丹池剩余次数（人生K线 / 六爻 / 八字 / 看相 / 问灵宠共用） */
export function usePetFoodRemaining() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const refresh = () => setRemaining(getRemaining("lifekline"));
    refresh();
    window.addEventListener(PET_FOOD_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PET_FOOD_UPDATED_EVENT, refresh);
  }, []);

  return remaining;
}
