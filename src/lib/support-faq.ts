/** 客服 FAQ — 关键词匹配，无需调用大模型 */

export interface SupportFaqEntry {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
}

export const SUPPORT_QUICK_PROMPTS = [
  "人生K线怎么用？",
  "六爻怎么起卦？",
  "灵丹是什么？",
  "怎么收养灵宠？",
  "主测算人怎么设置？",
];

export const SUPPORT_FAQ: SupportFaqEntry[] = [
  {
    id: "lifekline",
    title: "人生 K 线",
    keywords: ["人生k线", "人生k", "k线", "命势", "推演", "排盘", "流年", "月k"],
    answer:
      "【人生 K 线使用流程】\n\n1. 首页或底部导航进入「人生K线」\n2. 填写出生信息（可先设置主测算人）\n3. 选择推演年数（1年 / 3年 / 5年 / 10年 / 全部）\n4. 点击生成，查看年 K 线走势\n5. 单击某年可看月 K 线；双击可看流年分析\n\n提示：红涨绿跌，需消耗灵丹次数。",
  },
  {
    id: "liuyao",
    title: "AI 六爻",
    keywords: ["六爻", "起卦", "摇卦", "铜钱", "卦象", "占卜", "爻卦"],
    answer:
      "【AI 六爻使用流程】\n\n1. 进入「人生K线」→ 切换「AI六爻」标签\n2. 心中默念所问之事，输入问题\n3. 点击「开始爻卦」，用三枚铜钱连掷 6 次\n4. 六爻齐备后，点击「卦象解读」获取 AI 分析\n\n说明：六爻无需填写生辰，诚心发问即可。",
  },
  {
    id: "bazi",
    title: "八字排盘",
    keywords: ["八字", "四柱", "排盘", "天干", "地支", "流年", "流月"],
    answer:
      "【八字排盘使用流程】\n\n1. 进入「人生K线」→ 切换「八字排盘」标签\n2. 填写出生年月日时（支持阳历/农历）\n3. 生成四柱八字与命盘概览\n4. 可查看流年、流月运势及 AI 解读\n\n建议先设置主测算人，避免重复填写信息。",
  },
  {
    id: "xiang",
    title: "AI 看相",
    keywords: ["看相", "手相", "面相", "掌纹", "拍照", "扫描"],
    answer:
      "【AI 看相使用流程】\n\n1. 首页进入「AI看相」，或在人生K线 hub 切换「AI看相」\n2. 选择手相或面相模式\n3. 上传/拍摄清晰照片\n4. 等待 AI 分析，查看解读结果\n\n提示：光线充足、画面清晰可提高准确度。",
  },
  {
    id: "spirit-pet",
    title: "AI 灵宠",
    keywords: ["灵宠", "收养", "觉醒", "灵力", "品种", "九尾", "青龙", "月兔"],
    answer:
      "【AI 灵宠使用流程】\n\n1. 首页点击「马上收养我的第一只灵宠」\n2. 填写昵称与出生信息，选择灵宠品种\n3. 完成收养后可在「AI灵宠」页互动、做任务\n4. 灵力积累可解锁更高阶能力与陪伴模式\n\n灵宠会结合你的命格给出日常陪伴与建议。",
  },
  {
    id: "ask-pet",
    title: "问 AI 灵宠",
    keywords: ["问灵宠", "问ai", "聊天", "对话", "私信"],
    answer:
      "【问 AI 灵宠使用流程】\n\n1. 底部导航或首页进入「问AI灵宠」\n2. 确保已完成灵宠收养并设置主测算人\n3. 输入问题或点选快捷提问\n4. 灵宠结合命盘与状态给出回复\n\n每次提问消耗 1 次灵丹。",
  },
  {
    id: "fortune-stick",
    title: "今日灵签",
    keywords: ["灵签", "求签", "摇签", "签筒", "每日一签"],
    answer:
      "【今日灵签使用流程】\n\n1. 人生K线 hub 点「今日灵签」，或问灵宠页进入灵签模块\n2. 点击「摇动签筒 · 求灵签」\n3. 等待摇签动画完成，查看签文与解签\n\n每日限抽 1 签，次日刷新。",
  },
  {
    id: "daily-fortune",
    title: "今日运势指引",
    keywords: ["运势指引", "每日运势", "今日运势", "穿搭", "吉位"],
    answer:
      "【今日运势指引使用流程】\n\n1. 首页或人生K线 hub 点击「今日运势指引」\n2. 需先设置主测算人\n3. 查看当日运势、穿搭建议、吉位与行动提示\n\n适合每天快速了解当日宜忌。",
  },
  {
    id: "huangli",
    title: "今日老黄历",
    keywords: ["黄历", "老黄历", "农历", "宜", "忌", "宜忌"],
    answer:
      "【今日老黄历】\n\n首页「马上收养灵宠」按钮下方可查看「今日老黄历」，展示：\n· 今日农历日期\n· 今日宜做什么\n· 今日忌做什么\n\n数据每日自动更新，无需操作。",
  },
  {
    id: "pet-food",
    title: "灵丹",
    keywords: ["灵丹", "次数", "额度", "付费", "充值", "用完", "不足"],
    answer:
      "【灵丹说明】\n\n灵丹是使用 AI 功能的次数额度，人生K线、问灵宠、六爻等会消耗灵丹。\n\n· 可在个人菜单查看剩余次数\n· 点击「查看灵丹规则」了解获取方式\n· 次数不足时会提示开通或等待恢复\n\n若对计费有疑问，可转人工客服。",
  },
  {
    id: "primary-person",
    title: "主测算人",
    keywords: ["主测算人", "测算人", "本人", "档案", "出生信息"],
    answer:
      "【主测算人设置】\n\n1. 首次测算时会提示设置主测算人\n2. 在个人菜单或测算表单中填写姓名与出生信息\n3. 设置后各功能自动读取，无需重复填写\n\n姓名必填，用于报告与记录归档。",
  },
  {
    id: "records",
    title: "我的测算",
    keywords: ["记录", "历史", "测算记录", "我的测算", "报告"],
    answer:
      "【我的测算】\n\n1. 首页「更多服务」→「我的测算」，或人生K线 hub 进入\n2. 查看历史 K 线、六爻、看相等记录\n3. 可回顾 AI 分析与报告摘要\n\n建议测算完成后保存，方便日后对比。",
  },
  {
    id: "master",
    title: "问真人大师",
    keywords: ["真人", "大师", "人工", "咨询师"],
    answer:
      "【问真人大师】\n\n1. 首页或 hub 进入「问真人大师」\n2. 浏览大师列表，选择擅长领域\n3. 提交问题或预约咨询\n\n适合需要深度一对一解读的场景。平台客服请在本页点「转人工客服」。",
  },
  {
    id: "community",
    title: "社区",
    keywords: ["社区", "帖子", "分享", "交流"],
    answer:
      "【社区】\n\n底部导航进入「社区」，可浏览他人分享、发布动态。\n\n与测算功能独立，不参与灵丹消耗。",
  },
  {
    id: "shop",
    title: "灵宠商城",
    keywords: ["商城", "商店", "购买", "道具"],
    answer:
      "【灵宠商城】\n\n首页「更多服务」→「灵宠商城」，可浏览灵宠相关道具与周边。\n\n具体商品与活动以商城页展示为准。",
  },
  {
    id: "invite",
    title: "邀请好友",
    keywords: ["邀请", "好友", "分享链接", "推荐"],
    answer:
      "【邀请好友】\n\n个人菜单中可找到邀请入口，分享专属链接给好友。\n\n具体奖励规则以活动页说明为准。",
  },
  {
    id: "account",
    title: "账号与设置",
    keywords: ["登录", "注册", "账号", "昵称", "语言", "主题", "版本"],
    answer:
      "【账号与设置】\n\n点击右上角头像打开个人菜单，可：\n· 修改昵称与主题\n· 切换中/英文\n· 查看版本信息\n· 联系客服（就是本对话）",
  },
];

const FALLBACK_ANSWER =
  "抱歉，我暂时没理解您的问题。\n\n您可以试试下方快捷提问，或直接描述想了解的功能（如：人生K线、六爻、灵丹、灵宠等）。\n\n若仍无法解决，请点击「转人工客服」添加微信。";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

/** 根据用户输入匹配最相关的 FAQ */
export function matchSupportFaq(question: string): SupportFaqEntry | null {
  const q = normalize(question);
  if (!q) return null;

  let best: SupportFaqEntry | null = null;
  let bestScore = 0;

  for (const entry of SUPPORT_FAQ) {
    let score = 0;
    for (const kw of entry.keywords) {
      const k = normalize(kw);
      if (q.includes(k)) score += k.length >= 4 ? 3 : 2;
    }
    if (normalize(entry.title).split(/[/\s]/).some((part) => part && q.includes(part))) {
      score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0 ? best : null;
}

export function getSupportReply(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) return FALLBACK_ANSWER;

  const greeting = /^(你好|您好|hi|hello|在吗|有人吗)[!?？。]*$/i;
  if (greeting.test(trimmed)) {
    return "您好！我是 AI 客服助手，可以帮您了解平台各功能的使用流程。\n\n请直接提问，或点选下方快捷问题～";
  }

  const human = /人工|真人|微信|客服微信|转人工|找人工/;
  if (human.test(trimmed)) {
    return "如需人工协助，请点击对话框下方「转人工客服」按钮，即可查看客服微信号并复制添加。";
  }

  const matched = matchSupportFaq(trimmed);
  return matched?.answer ?? FALLBACK_ANSWER;
}

export const SUPPORT_WELCOME =
  "您好！我是 AI 客服助手 🤖\n\n我可以帮您了解人生K线、六爻、八字、看相、灵宠等功能的使用方法。\n\n请直接提问，或点选下方快捷问题～";
