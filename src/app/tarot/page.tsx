import { redirect } from "next/navigation";

/** 旧链接兼容：统一进入人生 K 线 Hub 的塔罗 AI 子菜单 */
export default function TarotPage() {
  redirect("/lifekline?tab=tarot");
}
