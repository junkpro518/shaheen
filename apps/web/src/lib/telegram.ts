import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/database.types";
import type { IssueBody } from "@/lib/pipeline/types";

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN!;
export const ADMIN_CHAT_ID = () => process.env.TELEGRAM_ADMIN_CHAT_ID!;

export async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`telegram ${method}: ${data.description ?? "error"}`);
  return data.result;
}

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Telegram review message (HTML). Kept under the 4096-char limit.
export function formatReview(draft: Tables<"draft_issues">): string {
  const b = (draft.body ?? {}) as unknown as IssueBody;
  const parts: string[] = [];
  parts.push(`👁️ <b>${esc(draft.title ?? "عدد اليوم")}</b>`);
  if (draft.intro) parts.push(esc(clip(draft.intro, 400)));

  if (b.tldr_bullets?.length) {
    parts.push("\n<b>نظرة الشاهين</b>");
    parts.push(b.tldr_bullets.map((x) => `• ${esc(x)}`).join("\n"));
  }
  if (b.main) {
    parts.push(`\n⚡️ <b>الانقضاضة: ${esc(b.main.title)}</b>`);
    parts.push(esc(clip(b.main.what, 350)));
    if (b.main.our_take) parts.push(`<b>بعين الشاهين:</b> ${esc(clip(b.main.our_take, 350))}`);
  }
  if (b.roundup?.length) {
    parts.push(`\n🪶 <b>رفّة جناح</b>`);
    parts.push(b.roundup.map((r) => `• ${esc(r.title)}`).join("\n"));
  }
  if (b.tools?.length) {
    parts.push(`\n🛠️ <b>عُدّة الشاهين</b>`);
    parts.push(b.tools.map((t) => `• ${esc(t.name)}`).join("\n"));
  }
  return clip(parts.join("\n"), 4000);
}

export function reviewKeyboard(draftId: string) {
  const id = draftId;
  return {
    inline_keyboard: [
      [
        { text: "✅ نشر", callback_data: `rv:publish:${id}` },
        { text: "❌ رفض", callback_data: `rv:reject:${id}` },
      ],
      [
        { text: "🔄 إعادة توليد", callback_data: `rv:regen:${id}` },
        { text: "⏰ تأجيل", callback_data: `rv:postpone:${id}` },
      ],
      [
        { text: "⛔️ إيقاف اليوم", callback_data: `rv:stop:${id}` },
        { text: "✏️ تعديل (اللوحة)", callback_data: `rv:edit:${id}` },
      ],
    ],
  };
}

// Second message: why these items — scores + how many were filtered out.
export async function sourcesReport(draft: Tables<"draft_issues">): Promise<string> {
  const supabase = createAdminClient();
  const meta = (draft.meta ?? {}) as { run_id?: string };
  const b = (draft.body ?? {}) as unknown as IssueBody;

  const newsIds = [
    b.main?.news_id,
    ...(b.roundup ?? []).map((r) => r.news_id),
    ...(b.tools ?? []).map((t) => t.news_id),
  ].filter(Boolean) as string[];

  const lines: string[] = ["📊 <b>تقرير العدد</b>"];

  if (meta.run_id) {
    const { data: run } = await supabase
      .from("pipeline_runs")
      .select("state")
      .eq("id", meta.run_id)
      .maybeSingle();
    const st = (run?.state ?? {}) as { candidates?: number; relevance_dropped?: number };
    lines.push(`مرشحون: ${st.candidates ?? "—"} · مفلتر (صلة منخفضة): ${st.relevance_dropped ?? "—"}`);
  }

  if (newsIds.length) {
    const { data: items } = await supabase
      .from("processed_items")
      .select("raw_item_id, importance, novelty, risk, analysis")
      .in("raw_item_id", newsIds);
    const byId = new Map((items ?? []).map((i) => [i.raw_item_id, i]));
    lines.push("\n<b>المختار:</b>");
    const titleFor = (id: string) =>
      id === b.main?.news_id
        ? b.main?.title
        : b.roundup?.find((r) => r.news_id === id)?.title ??
          b.tools?.find((t) => t.news_id === id)?.name ??
          "—";
    for (const id of newsIds.slice(0, 10)) {
      const p = byId.get(id);
      const rel = (p?.analysis as { relevance?: number } | null)?.relevance ?? "—";
      lines.push(
        `• ${esc(clip(titleFor(id) ?? "—", 60))} — أهمية ${p?.importance ?? "—"} · صلة ${rel} · مخاطرة ${p?.risk ?? "—"}`
      );
    }
  }
  return clip(lines.join("\n"), 4000);
}

// Apply a review button action to a draft. Returns the reply text.
// (regen is handled by the caller via after(); not here.)
export async function handleReviewAction(action: string, draftId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data: draft } = await supabase
    .from("draft_issues")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();
  if (!draft) return "لم يُعثر على العدد.";

  switch (action) {
    case "publish": {
      await supabase.from("draft_issues").update({ status: "approved" }).eq("id", draftId);
      const slug = `${draft.issue_date ?? "issue"}-${draftId.slice(0, 8)}`;
      await supabase.from("published_issues").upsert(
        {
          draft_issue_id: draftId,
          issue_date: draft.issue_date,
          type: draft.type,
          title: draft.title,
          slug,
          body: draft.body,
        },
        { onConflict: "slug", ignoreDuplicates: true }
      );
      return "✅ اعتُمد العدد ونُسخ للأرشيف. توزيع القنوات (بريد/قناة/واتساب/X) يأتي في Phase 7.";
    }
    case "reject":
      await supabase.from("draft_issues").update({ status: "rejected" }).eq("id", draftId);
      return "❌ رُفض العدد.";
    case "postpone":
      await supabase.from("draft_issues").update({ status: "postponed" }).eq("id", draftId);
      return "⏰ أُجّل العدد.";
    case "stop":
      await supabase
        .from("draft_issues")
        .update({ status: "rejected", meta: { ...(draft.meta as object), stopped: true } })
        .eq("id", draftId);
      return "⛔️ أُوقف نشر اليوم.";
    case "edit":
      return `✏️ للتعديل من اللوحة:\n/admin/issues/${draftId}`;
    default:
      return "إجراء غير معروف.";
  }
}

export async function sendReview(draft: Tables<"draft_issues">) {
  await tg("sendMessage", {
    chat_id: ADMIN_CHAT_ID(),
    text: formatReview(draft),
    parse_mode: "HTML",
    reply_markup: reviewKeyboard(draft.id),
    link_preview_options: { is_disabled: true },
  });
  await tg("sendMessage", {
    chat_id: ADMIN_CHAT_ID(),
    text: await sourcesReport(draft),
    parse_mode: "HTML",
  });
}
