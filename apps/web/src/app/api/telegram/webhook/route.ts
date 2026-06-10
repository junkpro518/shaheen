import { after, NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tg, handleReviewAction, sendReview } from "@/lib/telegram";
import { buildDailyIssue } from "@/lib/pipeline/run";

export const runtime = "nodejs";

// Receives Telegram updates (button presses). In prod, set via setWebhook with
// secret_token; in dev, a long-poll forwarder posts updates here with ?secret=.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secretOk =
    url.searchParams.get("secret") === process.env.INGEST_SECRET ||
    req.headers.get("x-telegram-bot-api-secret-token") === process.env.INGEST_SECRET;
  if (!secretOk) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const update = await req.json().catch(() => null);
  const cq = update?.callback_query;
  if (!cq) return NextResponse.json({ ok: true });

  const m = String(cq.data ?? "").match(/^rv:(\w+):(.+)$/);
  if (!m) {
    await tg("answerCallbackQuery", { callback_query_id: cq.id });
    return NextResponse.json({ ok: true });
  }
  const action = m[1];
  const draftId = m[2];
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;

  if (action === "regen") {
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "جارٍ إعادة التوليد…" });
    after(async () => {
      const r = await buildDailyIssue();
      if (r.draftId) {
        const supabase = createAdminClient();
        const { data: nd } = await supabase
          .from("draft_issues")
          .select("*")
          .eq("id", r.draftId)
          .maybeSingle();
        if (nd) await sendReview(nd);
      } else {
        await tg("sendMessage", { chat_id: chatId, text: `تعذّر التوليد: ${r.error ?? "خطأ"}` });
      }
    });
    return NextResponse.json({ ok: true });
  }

  const result = await handleReviewAction(action, draftId);
  // Telegram acknowledgements are best-effort — never fail the action over them.
  try {
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: result.slice(0, 200) });
  } catch {}
  if (chatId && messageId) {
    try {
      await tg("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      });
    } catch {}
    try {
      await tg("sendMessage", { chat_id: chatId, text: result, reply_to_message_id: messageId });
    } catch {}
  }
  return NextResponse.json({ ok: true, action, result });
}
