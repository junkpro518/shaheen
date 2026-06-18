import { NextResponse, type NextRequest } from "next/server";
import { createOrResubscribePending, isValidEmail, normalizeEmail } from "@/lib/subscribers";
import { sendEmail } from "@/lib/email/send";
import { confirmationEmailHtml } from "@/lib/email/templates";
import { getBrandAdmin } from "@/lib/brand";
import { getBaseUrl } from "@/lib/site";

export const runtime = "nodejs";

// Per-IP throttle (basic abuse guard). In-memory: fine for a single-instance deploy;
// resets on restart. Prevents using the verified domain to email-bomb third parties.
const ipHits = new Map<string, number[]>();
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX = 10;
function ipThrottled(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > IP_MAX;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (ipThrottled(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string };
  const email = typeof body.email === "string" ? body.email : "";
  const name = typeof body.name === "string" ? body.name : undefined;
  if (!isValidEmail(normalizeEmail(email))) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const result = await createOrResubscribePending(email, name);
  // Don't reveal prior existence beyond what UX needs; never re-send on cooldown.
  if (result.state === "already_active") return NextResponse.json({ ok: true, state: "already_active" });
  if (result.state === "cooldown") return NextResponse.json({ ok: true, state: "pending" });

  const brand = await getBrandAdmin();
  const brandName = brand?.name?.trim() || process.env.NEXT_PUBLIC_BRAND_NAME || "الشاهين";
  const accent = brand?.accent_color || "#C8932A";
  const base = await getBaseUrl();
  const confirmUrl = `${base}/api/subscribe/confirm?token=${encodeURIComponent(result.token)}`;

  const { subject, html } = confirmationEmailHtml({ brandName, confirmUrl, accent });
  await sendEmail({ to: normalizeEmail(email), subject, html });

  return NextResponse.json({ ok: true, state: "pending" });
}
