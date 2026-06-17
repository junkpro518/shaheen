# «الشاهين» — متابعة بأسلوب Spec-Driven (Spec Kit)

> ملف تسليم دائم. أي جلسة Claude جديدة: اقرأ هذا أولاً، ثم اتبع طريقة العمل أدناه.

أنت تكمل مشروعاً قائماً يستخدم **Spec Kit** (سكافولد في `.specify/` + أوامر `/speckit.*`). الـ `CLAUDE.md` يلزم spec-first.

## اقرأ أولاً (إلزامي قبل أي عمل)
`CLAUDE.md` · `AGENTS.md` · `docs/brand-identity.md` · ذاكرة المشروع (project-marsad / marsad-phase-plan / brand-identity) · `supabase/setup.sql`.

## المشروع
«الشاهين» نشرة ذكاء اصطناعي يومية عربية لروّاد الأعمال الخليجيين. المنطق كله في `apps/web` (Next.js 16). ريبو: junkpro518/shaheen. مسار: ~/Documents/Proj/0_0. التركيز التحريري: «AI → فرصة/أداة/مشروع لرائد الأعمال» (بوابة relevance في المحرك).

## المبني والشغّال (Phases 1–3 و 5)
- جمع RSS → `raw_items` بمنع تكرار: `lib/ingest.ts` + `/api/cron/ingest`
- المحرك: `lib/pipeline/run.ts` (تصنيف/تقييم → بوابة صلة → بلوكات → كتابة عربية + «بعين الشاهين» → عنوان + TL;DR → `draft_issues`) عبر OpenRouter (`lib/openrouter.ts`، نموذج/مهمة من `ai_models_config` + تتبّع توكنات/تكلفة)
- بوت تيليجرام للمراجعة: `lib/telegram.ts` + `/api/cron/send-review` + `/api/telegram/webhook` (نشر/رفض/تعديل/إعادة توليد/تأجيل/إيقاف). البوت @AlShaheenAi_bot
- لوحة: /admin/{brand,sources,raw-feed,issues,models,runs} · RLS + is_admin · دخول magic-link · PostHog + Sentry

## الحالة التقنية
- Supabase رسمي `tciiwpzkgtsoypuaghld` (eu-central-1) — DDL عبر Management API + PAT أو SQL Editor أو الـ supabase MCP
- كل المفاتيح في `apps/web/.env.local` (Supabase/OpenRouter/Telegram/PostHog/Sentry/Resend/X)
- `.mcp.json`: supabase + cloudflare-api (يحتاجان OAuth)
- مطبّات: `NEXT_PUBLIC_*` تُحقن وقت البناء (غيّرت رابط/مفتاح Supabase؟ أعد البناء) · استخدم `pnpm dev` (البناء الإنتاجي بطيء) · الجمع/الويبهوك محميّة بـ `INGEST_SECRET`

## طريقة العمل (Spec Kit) — بالترتيب
1. **`/speckit.constitution`** — رسّخ دستور الشاهين: عربي عملي · تركيز AI-لرواد-الأعمال · أمان (RLS/is_admin/secrets) · بساطة (CLAUDE.md) · مواعيد النشر (جمع 11م / بناء 12ص / مراجعة 12:30 / نشر 3ص) · human-in-the-loop عبر تيليجرام.
2. **توثيق رجعي للمبني**: `/speckit.specify` بمواصفة "baseline" تصف النظام الحالي (الجمع/المحرك/البوت/اللوحة) كمرجع، بدون إعادة بنائه.
3. **لكل مرحلة باقية**: `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`، مع اختبار حيّ (`pnpm dev`) قبل الاعتماد.

## المتبقّي (ابدأ بـ 7)
4. الهدايا (غنيمة اليوم)
5. (بقية) وضع المراجعة تلقائي/يدوي + `/admin/schedule` للتحكم بالأوقات
6. صور nano-banana (عبر OpenRouter — بدون مفتاح جديد)
7. **النشر الفعلي ⭐**: Resend بريد + مدونة عامة + قناة تيليجرام + X thread (المفاتيح جاهزة؛ ينقص توثيق دومين alshaheenai.com بـ DNS عبر Cloudflare MCP)
8. الموجز الأسبوعي
9. تحليلات + روابط تقييم القراء ✅/❌ + ربط Sentry
10. النشر على VPS (سيرفر جديد) + جدولة cron + نسخ احتياطي
- إضافات: مصدر The Neuron · شاشات (تصنيفات/مشتركين/إعلانات/أخطاء) · تحسينات المحرك المؤجلة (dedup دلالي، عقدة تحقّق)
- قبل الإطلاق: تدوير كل المفاتيح + إلغاء الـ PAT

ابدأ: `/speckit.constitution` ثم baseline ثم `/speckit.specify` لـ **Phase 7**.
