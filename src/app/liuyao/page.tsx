import { redirect } from "next/navigation";

/** 旧链接兼容：统一进入人生 K 线 Hub 的 AI 六爻子菜单 */
export default function LiuyaoPage() {
  redirect("/lifekline?tab=liuyao");
}
