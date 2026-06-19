# «الشاهين» — متابعة بأسلوب Spec-Driven (Spec Kit)

> ملف تسليم دائم. أي جلسة Claude جديدة: اقرأ هذا أولاً، ثم اتبع طريقة العمل أدناه.

أنت تكمل مشروعاً قائماً يستخدم **Spec Kit** (سكافولد في `.specify/` + أوامر `/speckit.*`). الـ `CLAUDE.md` يلزم spec-first.

## اقرأ أولاً (إلزامي قبل أي عمل)
`CLAUDE.md` · `AGENTS.md` · **الدستور `.specify/memory/constitution.md` (v1.0.0)** · المواصفات في `specs/` (انظر أدناه) · `docs/brand-identity.md` · ذاكرة المشروع (project-marsad / marsad-phase-plan / brand-identity) · `supabase/setup.sql`.

## المشروع
«الشاهين» نشرة ذكاء اصطناعي يومية عربية لروّاد الأعمال الخليجيين. المنطق كله في `apps/web` (Next.js 16). ريبو: junkpro518/shaheen. مسار: ~/Documents/Proj/0_0. التركيز التحريري: «AI → فرصة/أداة/مشروع لرائد الأعمال» (بوابة relevance في المحرك).

## المبني والشغّال (Phases 1–3 · 5 · 7)
- جمع RSS → `raw_items` بمنع تكرار: `lib/ingest.ts` + `/api/cron/ingest`
- المحرك: `lib/pipeline/run.ts` (تصنيف/تقييم → بوابة صلة → بلوكات → كتابة عربية + «بعين الشاهين» → عنوان + TL;DR → `draft_issues`) عبر OpenRouter (`lib/openrouter.ts`)
- بوت تيليجرام للمراجعة: `lib/telegram.ts` + `/api/cron/send-review` + `/api/telegram/webhook` (نشر/رفض/تعديل/إعادة توليد/تأجيل/إيقاف). البوت @AlShaheenAi_bot
- **Phase 7 — النشر الفعلي ✅** (مدونة + قناة تيليجرام + اشتراك بريد بتأكيد):
  - **التنسيق:** الاعتماد عبر تيليجرام يجعل العدد *جاهزاً للنشر*؛ ثم **مُطلِق نشر** `POST /api/cron/publish` (محمي بـ `x-ingest-secret`، هدفه الافتراضي عدد اليوم) يوزّع على القنوات المفعّلة ويسجّل النتائج في `published_issues.channel_results`. المنسّق `lib/publish/run.ts`: **المدونة أولاً**، ثم بريد/تيليجرام (يعتمدان على نجاح المدونة لأنهما يحملان رابطها).
  - **المدونة:** `/issues` (أرشيف) و`/issues/[slug]` (عدد كامل RTL + OG)، تظهر فقط بعد `channel_results.blog=success`. مكوّن العرض `components/issue-view.tsx`.
  - **قناة تيليجرام:** `lib/publish/telegram-channel.ts` → ملخّص + رابط المدونة إلى `@AlShaheenAi` (الإعداد في `publishing_channels`). مُختبرة.
  - **الاشتراك:** double opt-in — `/subscribe` + `/api/subscribe` (throttle) + `confirm` + `unsubscribe` (رابط واحد بنقرة). البريد عبر **raw-fetch إلى Resend** (`lib/email/send.ts` + `templates.ts`)، لا SDK.
  - **البريد مثبّت يصل** من `news@alshaheenai.com` (هجرة `subscribers` مطبّقة على الإنتاج؛ رسالة تأكيد اختبارية وصلت `delivered`).
  - commits: `1ce14bd` (دستور+مواصفات) · `26a3abf` (مدونة+منسّق) · `59be08a` (قناة+اشتراك) · `4d6934e` (هجرة+تأكيد البريد).
- لوحة: /admin/{brand,sources,raw-feed,issues,models,runs} · RLS + is_admin · دخول magic-link · PostHog + Sentry

## الحالة التقنية
- Supabase رسمي `tciiwpzkgtsoypuaghld` (eu-central-1). الـ `supabase` MCP متصل (apply_migration/execute_sql تعمل). هجرة Phase 7 طُبّقت عبره.
- كل المفاتيح في `apps/web/.env.local` (Supabase/OpenRouter/Telegram/PostHog/Sentry/Resend/X) + `NEXT_PUBLIC_SITE_URL`.
- `.mcp.json`: supabase + cloudflare-api.
- مطبّات: `NEXT_PUBLIC_*` تُحقن وقت البناء · الجمع/البناء/النشر/الويبهوك محميّة بـ `INGEST_SECRET` · الخط Thmanyah محلي (`display:"block"` لمنع وميض fallback).
- **⚠️ عدم استقرار `pnpm dev`:** هذه الجلسة شهدت ٤ أعطال (تلف pnpm store/semver، تلف `.next` مرتين، تعليق طلبات بلا لوج compile). علاجات مؤقتة: `pnpm install --force` + `rm -rf apps/web/.next` + إعادة التشغيل. يُعالَج بجلسة مخصّصة أو يُتجاوز بنشر VPS (Phase 10) حيث يعمل نظيفاً.

## مواصفات Spec Kit (مكتملة)
- **الدستور** `.specify/memory/constitution.md` v1.0.0 (٦ مبادئ + قيود تشغيلية/سير عمل).
- **`specs/001-baseline-as-built`** — توثيق رجعي للنظام المبني (مرجع).
- **`specs/002-real-publishing`** — Phase 7 كامل: spec + clarify + plan + research + data-model + contracts + tasks. حالة المهام مُحدّثة في `tasks.md`.

## المتبقّي
- **متبقّي من Phase 7:** `T023` — **النشرة الجماعية** (`lib/publish/email.ts`: إرسال دفعات Resend لكل المشتركين الفعّالين + List-Unsubscribe + idempotency). **لم تُبنَ بعد، وموقوفة (gated)** حتى إذن صريح.
- **Phase 10 — النشر على VPS: ملفات النشر جاهزة ✅** (السيرفر `13.140.187.42` **AWS** — يستبدل Contabo القديم `109.199.111.27`). **النشر خلف Traefik الموجود مسبقاً على السيرفر** (يتولّى HTTPS عبر Let's Encrypt). DNS مضبوط: `@` و`www` → `13.140.187.42` (DNS-only/سحابة رمادية — لازم لتحدّي ACME). أُنشئت الملفات ولم تُشغَّل بعد (البناء على السيرفر):
  - `apps/web/next.config.ts` → `output:"standalone"` (+ `outputFileTracingRoot` للـ monorepo).
  - `apps/web/Dockerfile` متعدد المراحل (deps→build→runner `node:22-slim`) + `.dockerignore` (الجذر). **سياق البناء = جذر الريبو** (لازم للـ pnpm workspace lockfile)؛ compose يبني بـ `context: ..` و`dockerfile: apps/web/Dockerfile`. الـ `NEXT_PUBLIC_*` (عامة، ليست أسراراً) تُمرَّر كـ build args.
  - `infra/docker-compose.yml`: خدمة `app` فقط، على شبكة **`proxy` الخارجية** مع **labels لـ Traefik** (router `shaheen`، `entrypoints=websecure`، `tls.certresolver=myresolver`، `loadbalancer.server.port=3000`). لا منافذ منشورة ولا خدمة caddy. **الأسرار في `infra/.env` على السيرفر فقط (gitignored)** — يستعمله compose للـ build args وللـ runtime env_file.
  - **Traefik** (موجود مسبقاً على السيرفر) يتولّى الـ routing وHTTPS عبر Let's Encrypt (`certresolver=myresolver`). **لا Caddy/Caddyfile** (أُزيل). الشرط: شبكة `proxy` موجودة وTraefik شغّال، وDNS يشير للسيرفر.
  - `infra/crontab.example`: مهام بتوقيت الرياض (CRON_TZ) — جمع 23:00 · بناء 00:00 · مراجعة 00:30 · نشر 03:00 — تقرأ `INGEST_SECRET` من `infra/.env` وقت التنفيذ (لا أسرار في الملف).
  - **خطوات النشر على السيرفر:** انسخ الريبو → أنشئ `infra/.env` (من `.env.example` + قيم `NEXT_PUBLIC_*`) → تأكّد أن شبكة `proxy` موجودة وTraefik شغّال → `cd infra && docker compose up -d --build` → Traefik يلتقط الـ labels ويصدر الشهادة تلقائياً → `crontab infra/crontab.example` (بعد ضبط المسار) → نسخ احتياطي.
- **بقية المراحل:** 4) الهدايا (غنيمة اليوم) · 6) صور nano-banana (عبر OpenRouter) · 8) الموجز الأسبوعي · 9) التحليلات + روابط تقييم القرّاء + ربط Sentry.
- **مؤجّلات المحرك:** dedup دلالي · عقدة تحقّق · مصدر The Neuron · X (مؤجّلة — تحتاج طبقة API مدفوعة ~$100+/شهر).

## قبل الإطلاق
- تدوير **كل** المفاتيح + إلغاء الـ PAT (Supabase Management API).
- مراجعة كل المؤجّلات أعلاه.
- **ملاحظة بيانات:** يوجد صف مشترك تجريبي `alshaheendaily@gmail.com` (status=pending) أُضيف لاختبار البريد — **احذفه أو أكّده بعد النشر** (رابط التأكيد يشير إلى `alshaheenai.com` ولن يعمل قبل النشر).

## طريقة العمل (Spec Kit) — بالترتيب لكل عمل جديد
الدستور والمواصفات الأساسية جاهزة. لأي ميزة/مرحلة جديدة: `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`، مع اختبار حيّ قبل الاعتماد، وإيقاف عند الخطوات الحسّاسة (هجرات إنتاج، إرسال حقيقي، DNS، نشر عام) لإذن المستخدم خطوة بخطوة.

**ابدأ التالي:** نفّذ النشر على السيرفر (ملفات Phase 10 جاهزة، انظر خطوات النشر أعلاه) — أو إنهاء `T023` (النشرة الجماعية) بإذن صريح.
