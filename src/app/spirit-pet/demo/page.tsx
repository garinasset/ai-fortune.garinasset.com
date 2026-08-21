"use client";

import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import BackLink from "@/components/ui/BackLink";
import SectionCard from "@/components/ui/SectionCard";
import SpiritPetVisualDemo from "@/components/SpiritPetVisualDemo";

export default function SpiritPetDemoPage() {
  return (
    <div className="page-shell mx-auto max-w-lg px-4 pb-10 pt-4">
      <BackLink href="/spirit-pet" label="返回灵宠" />
      <PageHeader
        title="灵兽动效预览"
        subtitle="预览静态灵兽图与东方玄幻氛围动效"
      />

      <SectionCard className="mt-4">
        <SpiritPetVisualDemo />
      </SectionCard>

      <div className="caption mt-4 space-y-2 text-app-muted">
        <p>
          当前版本包含 <strong className="text-app-gold">基础动效</strong>：PNG 主体 + Canvas 金粉粒子 + CSS 光晕/云雾/地面金纹。
        </p>
        <p>
          后续可继续叠加尾焰骨骼动画、交互触发动效、按等级换肤等能力。
        </p>
        <p>
          <Link href="/spirit-pet" className="text-app-gold underline-offset-2 hover:underline">
            回到灵宠主页
          </Link>
        </p>
      </div>
    </div>
  );
}
