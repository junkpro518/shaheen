import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeByToken } from "@/lib/subscribers";

export const runtime = "nodejs";

// POST: the email one-click List-Unsubscribe-Post target. Always 200 (no token enumeration).
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (token) await unsubscribeByToken(token);
  return NextResponse.json({ ok: true });
}

// GET: the human link in the email; renders an Arabic confirmation page.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (token) await unsubscribeByToken(token);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>إلغاء الاشتراك</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px 24px;color:#0C2340;">
  <h1 style="font-size:24px;">تم إلغاء اشتراكك</h1>
  <p style="font-size:16px;color:#555;">لن تصلك رسائل النشرة بعد الآن.</p>
</body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
