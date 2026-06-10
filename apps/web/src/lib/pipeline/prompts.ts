import type { Candidate, BrandVoice, Scored } from "./types";

export const CATEGORIES = [
  "ai",
  "business",
  "ecommerce",
  "automation",
  "tech",
  "marketing",
  "productivity",
] as const;

export const AUDIENCES = [
  "entrepreneurs",
  "store_owners",
  "marketers",
  "freelancers",
  "automation",
] as const;

function voiceHeader(b: BrandVoice): string {
  return `أنت المحرّر الذكي لنشرة «${b.name}» — نشرة الذكاء الاصطناعي لروّاد الأعمال في الخليج.
نبرتك: ${b.tone}
اكتب عربيّاً فصيحاً واضحاً وعمليّاً، بلا حشو وبلا مبالغة تسويقية.`;
}

// ── classify + score (batched) ──
export function classifyScorePrompt(items: Candidate[]) {
  const system = `أنت محلّل أخبار تقنية. صنّف وقيّم كل خبر بدقة وحياد. أعد JSON فقط بلا أي نص خارج JSON.`;
  const list = items
    .map(
      (it, i) =>
        `${i + 1}. id="${it.id}" | العنوان: ${it.title} | مقتطف: ${(it.content || "").slice(0, 400)}`
    )
    .join("\n");
  const user = `صنّف وقيّم كل خبر من القائمة.
التصنيفات المسموحة (category_slug): ${CATEGORIES.join(", ")}
الجمهور المسموح (audience، اختر ما يناسب): ${AUDIENCES.join(", ")}

لكل خبر أعطِ:
- importance (0-100): أهميته لرائد أعمال خليجي
- novelty (0-100): مدى جِدّته وطرافته
- risk (0-100): احتمال أن يكون مبالَغاً فيه أو غير موثوق أو إشاعة
- is_tool (true/false): هل الخبر إطلاق أداة أو منتج جاهز للتجربة (وليس مجرد خبر/تحليل)؟
- summary: جملة عربية واحدة تلخّص الخبر
- reason: لماذا يهم (أو لا يهم) جمهورنا، بإيجاز

الأخبار:
${list}

أعد بهذا الشكل بالضبط:
{"items":[{"id":"...","category_slug":"ai","audience":["entrepreneurs"],"importance":70,"novelty":60,"risk":20,"is_tool":false,"summary":"...","reason":"..."}]}`;
  return { system, user };
}

// ── main story full treatment ──
export function mainStoryPrompt(b: BrandVoice, item: Candidate, summary: string) {
  const system = `${voiceHeader(b)}
أنت تكتب «الانقضاضة» — الخبر الرئيسي لعدد اليوم. أعد JSON فقط.`;
  const user = `الخبر الرئيسي:
العنوان: ${item.title}
المحتوى: ${(item.content || summary).slice(0, 2500)}
الرابط: ${item.url ?? "غير متوفر"}

اكتب تحليلاً عمليّاً بحقول JSON التالية (كلها بالعربية):
- title: عنوان عربي جذّاب وموجز للخبر (لا تترك العنوان بالإنجليزية)
- what: ماذا حدث؟ (فقرة قصيرة واضحة)
- why: لماذا هذا مهم؟
- who: من يستفيد منه؟ (روّاد أعمال/تجار/مسوّقون/مستقلّون…)
- how: كيف يُطبَّق عمليّاً في السوق الخليجي؟ خطوة ملموسة
- warning: تحذير أو ملاحظة نقدية مختصرة (إن وُجد، وإلا اتركه فارغاً)
- our_take: رأي «${b.name}» التحريري المختصر — بصيرة لا يقدر المترجم الآلي يقلّدها

أعد: {"title":"...","what":"...","why":"...","who":"...","how":"...","warning":"...","our_take":"..."}`;
  return { system, user };
}

// ── roundup blurbs (batched) ──
export function roundupPrompt(b: BrandVoice, items: { id: string; title: string; summary: string }[]) {
  const system = `${voiceHeader(b)}
أنت تكتب «رفّة جناح» — جولة أخبار سريعة. لكل خبر جملة أو جملتان عربيّتان تشرحان الخبر وأهميته بإيجاز. أعد JSON فقط.`;
  const list = items.map((it) => `id="${it.id}" | ${it.title} — ${it.summary}`).join("\n");
  const user = `لكل خبر أعطِ عنواناً عربيّاً موجزاً (title) وفقرة قصيرة عملية (blurb، جملة أو جملتان) بنبرة النشرة:
${list}

أعد: {"items":[{"id":"...","title":"...","blurb":"..."}]}`;
  return { system, user };
}

// ── tools blurbs (batched) ──
export function toolsPrompt(b: BrandVoice, items: { id: string; title: string; summary: string }[]) {
  const system = `${voiceHeader(b)}
أنت تكتب «عُدّة الشاهين» — أدوات/منتجات جديدة تستحق التجربة. لكل أداة: الاسم + جملة عملية عن فائدتها لرائد الأعمال. أعد JSON فقط.`;
  const list = items.map((it) => `id="${it.id}" | ${it.title} — ${it.summary}`).join("\n");
  const user = `لكل أداة أعطِ name (اسم مختصر) و blurb (جملة عربية عن الفائدة العملية):
${list}

أعد: {"items":[{"id":"...","name":"...","blurb":"..."}]}`;
  return { system, user };
}

// ── headline + intro + TL;DR ──
export function headlinePrompt(b: BrandVoice, scored: Scored[]) {
  const system = `${voiceHeader(b)}
أنت تكتب رأس العدد: عنوان، افتتاحية «${b.name} يرصد لك اليوم…»، وملخص «نظرة الشاهين» (٥ نقاط). أعد JSON فقط.`;
  const list = scored
    .slice(0, 12)
    .map((s) => `- ${s.summary}`)
    .join("\n");
  const user = `أهم أخبار اليوم:
${list}

أعطِ:
- title: عنوان جذّاب موجز لعدد اليوم
- intro: افتتاحية قصيرة (٢-٣ جمل) تبدأ بروح «${b.name} يرصد لك اليوم…» وتربط خيط اليوم
- main_topic: الموضوع المحوري لليوم بكلمتين أو ثلاث
- tldr_bullets: مصفوفة من ٥ نقاط قصيرة جداً «وش صار اليوم» (كل نقطة سطر)

أعد: {"title":"...","intro":"...","main_topic":"...","tldr_bullets":["...","...","...","...","..."]}`;
  return { system, user };
}
