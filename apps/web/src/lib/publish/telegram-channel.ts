import "server-only";
import type { Tables } from "@/lib/database.types";
import type { IssueBody } from "@/lib/pipeline/types";
import type { ChannelResult } from "@/lib/publish/types";
import { tg } from "@/lib/telegram";
import { getChannelConfig } from "@/lib/channels";
import { issueUrl } from "@/lib/site";

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Trim to a max length on a word boundary (never mid-word), adding an ellipsis.
function clipWords(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

// Posts a SUMMARY of the issue (headline + a few TL;DR bullets) + a link to the
// full read on the blog, to the configured public channel. Reuses the bot via tg().
// Runs only after the blog is live (orchestrator enforces the dependency).
export async function publishTelegramChannel(issue: Tables<"published_issues">): Promise<ChannelResult> {
  const at = new Date().toISOString();

  const config = await getChannelConfig("telegram");
  const channelId = (config.channel_id as string | undefined)?.trim();
  if (!channelId) return { status: "failed", at, summary: { error: "no channel_id configured" } };
  if (!issue.slug) return { status: "failed", at, summary: { error: "issue has no slug" } };

  const body = (issue.body ?? {}) as unknown as IssueBody;
  const url = await issueUrl(issue.slug);
  const title = issue.title ?? "عدد الشاهين";
  const bullets = (body.tldr_bullets ?? []).slice(0, 3).map((b) => clipWords(b, 160));

  const parts: string[] = [`👁️ <b>${esc(title)}</b>`];
  if (bullets.length) parts.push(bullets.map((b) => `• ${esc(b)}`).join("\n"));
  parts.push(`\n📖 اقرأ العدد كاملاً:\n${esc(url)}`);
  const text = parts.join("\n");

  const res = await tg("sendMessage", {
    chat_id: channelId,
    text,
    parse_mode: "HTML",
  });

  return { status: "success", at, summary: { message_id: res?.message_id, channel_id: channelId } };
}
