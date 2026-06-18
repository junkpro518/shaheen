import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnabledChannels } from "@/lib/channels";
import type { Json, Tables } from "@/lib/database.types";
import { CHANNEL_ORDER, type ChannelName, type ChannelResult, type ChannelResults } from "@/lib/publish/types";
import { publishBlog } from "@/lib/publish/blog";
import { publishTelegramChannel } from "@/lib/publish/telegram-channel";

export type PublishOptions = {
  channels?: string[]; // default: all channels
  force?: boolean; // re-run channels already at success
};

export type PublishOutcome = {
  issueId: string;
  slug: string | null;
  results: ChannelResults;
};

// Orchestrator: the SINGLE writer of published_issues.channel_results.
// Runs channels in CHANNEL_ORDER (blog first); email/telegram are attempted only
// if blog is success (they embed the blog URL). One channel's failure never aborts
// the others. Idempotent: a channel already at success is kept unless force=true.
export async function publishIssue(issueId: string, opts: PublishOptions = {}): Promise<PublishOutcome> {
  const supabase = createAdminClient();
  const { data: issue } = await supabase
    .from("published_issues")
    .select("*")
    .eq("id", issueId)
    .maybeSingle();
  if (!issue) throw new Error(`published_issue ${issueId} not found`);

  const enabled = new Set(await getEnabledChannels());
  const requested = opts.channels?.length ? opts.channels : [...CHANNEL_ORDER];
  const targets = CHANNEL_ORDER.filter((c) => requested.includes(c)); // canonical order, blog first

  const existing = (issue.channel_results ?? {}) as ChannelResults;
  const results: ChannelResults = { ...existing };

  for (const channel of targets) {
    const now = () => new Date().toISOString();

    if (!enabled.has(channel)) {
      results[channel] = { status: "skipped", at: now(), summary: { reason: "channel disabled" } };
      continue;
    }
    if (!opts.force && existing[channel]?.status === "success") {
      results[channel] = existing[channel]!;
      continue;
    }
    // Link-bearing channels depend on the blog being live.
    if (channel !== "blog" && results.blog?.status !== "success") {
      results[channel] = { status: "failed", at: now(), summary: { error: "blog not live" } };
      continue;
    }

    try {
      results[channel] = await runChannel(channel, issue);
    } catch (e) {
      results[channel] = { status: "failed", at: now(), summary: { error: (e as Error).message } };
    }
  }

  await supabase
    .from("published_issues")
    .update({ channel_results: results as unknown as Json })
    .eq("id", issueId);

  return { issueId, slug: issue.slug, results };
}

async function runChannel(channel: ChannelName, issue: Tables<"published_issues">): Promise<ChannelResult> {
  switch (channel) {
    case "blog":
      return publishBlog(issue);
    case "telegram":
      return publishTelegramChannel(issue);
    case "email":
      // Newsletter send (real outbound) is gated — implemented in the email increment.
      return { status: "skipped", at: new Date().toISOString(), summary: { reason: "email channel not implemented yet" } };
  }
}
