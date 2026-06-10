# الشاهين 🦅 — نشرة الذكاء الاصطناعي لروّاد الأعمال

> «يرى الفرصة قبل أن تصير خبراً». الهوية الكاملة في [docs/brand-identity.md](docs/brand-identity.md).
> الاسم والهوية يُعدّلان من `brand_config` ولوحة `/admin/brand` بدون تعديل كود. (البنية التحتية — Supabase/GitHub — تبقى بأسمائها المؤقتة.)

نظام عربي ينتج نشرة يومية وملخصاً أسبوعياً عن الذكاء الاصطناعي والأعمال والتقنية: يجمع من مصادر متعددة، يصفّي ويقيّم، يكتب بهوية المشروع بتوجه عملي للسوق الخليجي، ثم ينشر عبر قنوات متعددة مع لوحة تحكم وبوت مراجعة.

## البنية (Monorepo — pnpm workspaces)

```
apps/web/            Next.js 16 — لوحة التحكم + المدونة العامة (RTL/عربي)
services/            (لاحقاً) pipeline (LangGraph) · bot (Telegram) · publisher
supabase/migrations/ مخطط قاعدة البيانات
infra/               (لاحقاً) Docker Compose · Caddy — للنشر على VPS
```

## التشغيل محلياً

```bash
pnpm install
cp .env.example apps/web/.env.local   # واملأ قيم Supabase
pnpm dev                              # http://localhost:3000
```

## المراحل

البناء على مراحل (Phase 1 = الأساس + لوحة الهوية). التفاصيل في خطة المشروع.

## الأمان

- لا تُرفع `.env*.local` إطلاقاً (مستثناة في `.gitignore`).
- كل جدول في قاعدة البيانات عليه RLS؛ صلاحيات الكتابة محصورة بإيميلات جدول `admins`.
- روِّح التوكنات (rotate) قبل النشر النهائي على VPS.
