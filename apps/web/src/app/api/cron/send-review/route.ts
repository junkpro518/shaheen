import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReview } from "@/lib/telegram";

export const runtime = "nodejs";

// Sends the latest in-review draft to the admin's Telegram for approval.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!process.env.INGEST_SECRET || secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const draftId = body?.draftId as string | undefined;

  const query = supabase
    .from("draft_issues")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);
  const { data } = draftId
    ? await supabase.from("draft_issues").select("*").eq("id", draftId).maybeSingle().then((r) => ({ data: r.data ? [r.data] : [] }))
    : await query.eq("status", "in_review");

  const draft = data?.[0];
  if (!draft) return NextResponse.json({ ok: false, error: "no in_review draft" }, { status: 404 });

  try {
    await sendReview(draft);
    return NextResponse.json({ ok: true, draftId: draft.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
